// src/controllers/applicationController.js
const Application = require('../models/Application');
const Property = require('../models/Property');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');
const { calculateLandlordTrustScore } = require('../services/trustService');

/**
 * Computes deterministic application screening score for Bangladesh rental context.
 * Income vs Rent (0-50 pts): standard rule is income >= 3x rent
 * Employment/Occupation (0-30 pts): stable profession / employment
 * Occupancy Density (0-20 pts): healthy space-to-occupant ratio
 */
function computeScore(form = {}, rent = 10000) {
  const income = Number(form.incomeMonthly) || 0;
  const occupants = Number(form.occupants) || 1;

  // 1. Income Ratio (50 pts max)
  let incomeScore = 0;
  if (rent > 0) {
    const ratio = income / rent;
    if (ratio >= 3.5) incomeScore = 50;
    else if (ratio >= 3.0) incomeScore = 45;
    else if (ratio >= 2.5) incomeScore = 38;
    else if (ratio >= 2.0) incomeScore = 28;
    else if (ratio >= 1.5) incomeScore = 15;
    else incomeScore = 5;
  }

  // 2. Employment / Profession (30 pts max)
  let empScore = 20;
  const status = String(form.employmentStatus || '').toLowerCase();
  if (status.includes('employed') || status.includes('business') || status.includes('professional')) {
    empScore = 30;
  } else if (status.includes('student')) {
    empScore = 20; // Students with family support
  } else if (status.includes('self-employed')) {
    empScore = 25;
  }

  // 3. Occupants density score (20 pts max)
  let occScore = 20;
  if (occupants > 5) occScore = 10;
  else if (occupants > 3) occScore = 16;

  const total = Math.min(100, Math.max(0, incomeScore + empScore + occScore));
  return total;
}

/**
 * POST /api/applications
 * Tenant submits a rental application for a property.
 */
exports.submit = async (req, res, next) => {
  try {
    const { propertyId, property, form } = req.body;
    const targetPropId = propertyId || property;

    if (!targetPropId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    if (!mongoose.isValidObjectId(targetPropId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const prop = await Property.findById(targetPropId);
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ message: 'Property is not available for applications' });
    }

    if (prop.status === 'rented' || prop.status === 'unavailable') {
      return res.status(400).json({ message: 'This property is not currently accepting applications' });
    }

    // Landlord cannot apply to own property
    if (String(prop.owner) === String(req.user._id)) {
      return res.status(403).json({ message: 'You cannot submit a rental application for your own property' });
    }

    // Prevent duplicate active pending applications
    const existing = await Application.findOne({
      property: prop._id,
      tenant: req.user._id,
      status: { $in: ['pending', 'info_requested'] }
    });

    if (existing) {
      return res.status(400).json({
        message: 'You already have an active rental application for this property'
      });
    }

    const score = computeScore(form || {}, prop.rent);

    const application = await Application.create({
      property: prop._id,
      tenant: req.user._id,
      landlord: prop.owner,
      form: {
        incomeMonthly: form?.incomeMonthly ? Number(form.incomeMonthly) : 0,
        employmentStatus: form?.employmentStatus ? String(form.employmentStatus).trim() : 'Employed',
        occupation: form?.occupation ? String(form.occupation).trim() : '',
        occupants: form?.occupants ? Number(form.occupants) : 1,
        preferredMoveInDate: form?.preferredMoveInDate ? new Date(form.preferredMoveInDate) : undefined,
        nidOrPassport: form?.nidOrPassport ? String(form.nidOrPassport).trim() : '',
        emergencyContact: form?.emergencyContact ? String(form.emergencyContact).trim() : '',
        pets: !!form?.pets,
        message: form?.message ? String(form.message).trim() : '',
        landlordRating: form?.landlordRating ? Number(form.landlordRating) : 5
      },
      score,
      status: 'pending',
      statusHistory: [
        { status: 'pending', by: req.user._id, changedAt: new Date(), note: 'Application submitted by tenant' }
      ]
    });

    // Notify landlord of application
    await createNotification({
      recipient: prop.owner,
      sender: req.user._id,
      type: 'application_submitted',
      title: 'New Rental Application Submitted',
      message: `${req.user.name || 'A tenant'} applied for "${prop.title}" (Screening Match Score: ${score}%).`,
      link: '/landlord'
    });

    const populated = await Application.findById(application._id)
      .populate('property', 'title address city state country rent imageUrl images verificationStatus costs rules')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications/mine (and /me)
 * List applications relevant to the authenticated user.
 */
exports.mine = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'tenant') {
      filter = { tenant: req.user._id };
    } else if (req.user.role === 'landlord') {
      filter = { landlord: req.user._id };
    }

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .populate('property', 'title address city state country rent imageUrl images verificationStatus costs rules status')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone verificationStatus trustScore');

    res.json(applications);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications/:id
 * Get single application details with tenant screening breakdown.
 */
exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const app = await Application.findById(id)
      .populate('property', 'title address city state country rent imageUrl images owner costs rules')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone trustScore');

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isTenant = String(app.tenant?._id) === String(req.user._id);
    const isLandlord = String(app.landlord?._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: access denied' });
    }

    const screening = {
      score: app.score,
      incomeVsRentRatio: app.form?.incomeMonthly && app.property?.rent
        ? Number((app.form.incomeMonthly / app.property.rent).toFixed(1))
        : null,
      occupation: app.form?.occupation || 'Not specified',
      occupants: app.form?.occupants || 1,
      pets: app.form?.pets || false
    };

    res.json({ application: app, screening });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/status
 * Landlord or Admin approves or rejects application with reason.
 */
exports.setStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionCategory, explanation, updatePropertyStatus = false } = req.body;

    const allowed = ['pending', 'info_requested', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid application status update' });
    }

    const app = await Application.findById(id).populate('property', 'title status owner');
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isLandlord = String(app.landlord) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isLandlord && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only the landlord can update application status' });
    }

    if (app.status === 'withdrawn') {
      return res.status(400).json({ message: 'Cannot modify an application that was withdrawn by the tenant' });
    }

    app.status = status;

    // Structured rejection reason
    if (status === 'rejected') {
      app.rejectionReason = {
        category: rejectionCategory || 'other',
        explanation: explanation ? String(explanation).trim() : '',
        decidedBy: req.user._id,
        decidedAt: new Date()
      };
    }

    app.statusHistory.push({
      status,
      by: req.user._id,
      changedAt: new Date(),
      note: status === 'rejected' && explanation ? explanation : `Status updated to ${status}`
    });

    await app.save();

    // If application approved and requested, update property status
    if (status === 'approved' && updatePropertyStatus && app.property) {
      await Property.findByIdAndUpdate(app.property._id, { status: 'rented' });
    }

    // Refresh landlord trust score
    calculateLandlordTrustScore(app.landlord).catch(console.error);

    // Notify tenant of outcome
    let msg = `Your rental application for "${app.property?.title || 'Property'}" has been ${status}.`;
    if (status === 'rejected' && rejectionCategory) {
      msg += ` (Reason: ${rejectionCategory.replace(/_/g, ' ')})`;
    }

    await createNotification({
      recipient: app.tenant,
      sender: req.user._id,
      type: 'application_status',
      title: `Rental Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: msg,
      link: '/tenant'
    });

    const populated = await Application.findById(app._id)
      .populate('property', 'title address city state country rent imageUrl images verificationStatus costs rules')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/withdraw
 * Tenant withdraws their pending application.
 */
exports.withdraw = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const app = await Application.findById(id).populate('property', 'title');
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (String(app.tenant) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you are not the owner of this application' });
    }

    if (['approved', 'rejected', 'withdrawn', 'cancelled'].includes(app.status)) {
      return res.status(400).json({ message: `Cannot withdraw application because it is already ${app.status}` });
    }

    app.status = 'withdrawn';
    app.rejectionReason = {
      category: 'applicant_withdrew',
      explanation: reason ? String(reason).trim() : 'Applicant chose to withdraw application',
      decidedBy: req.user._id,
      decidedAt: new Date()
    };

    app.statusHistory.push({
      status: 'withdrawn',
      by: req.user._id,
      changedAt: new Date(),
      note: reason ? `Withdrawn: ${reason}` : 'Tenant withdrew application'
    });

    await app.save();

    // Notify landlord
    await createNotification({
      recipient: app.landlord,
      sender: req.user._id,
      type: 'application_withdrawn',
      title: 'Application Withdrawn',
      message: `${req.user.name || 'A tenant'} has withdrawn their application for "${app.property?.title}".`,
      link: '/landlord'
    });

    const populated = await Application.findById(app._id)
      .populate('property', 'title address city state country rent imageUrl images verificationStatus costs rules')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/request-info
 * Landlord requests additional info or clarifications from applicant.
 */
exports.requestInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'A request message is required' });
    }

    const app = await Application.findById(id).populate('property', 'title');
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (String(app.landlord) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only the landlord can request more info' });
    }

    app.status = 'info_requested';
    app.additionalInfoRequest = {
      message: String(message).trim(),
      requestedAt: new Date(),
      response: '',
      respondedAt: null
    };

    app.statusHistory.push({
      status: 'info_requested',
      by: req.user._id,
      changedAt: new Date(),
      note: `Landlord requested info: ${message}`
    });

    await app.save();

    // Notify tenant
    await createNotification({
      recipient: app.tenant,
      sender: req.user._id,
      type: 'application_info_requested',
      title: 'Landlord Requested Additional Information',
      message: `The landlord of "${app.property?.title}" asked: "${message}". Please review and respond.`,
      link: '/tenant'
    });

    const populated = await Application.findById(app._id)
      .populate('property', 'title address city state country rent imageUrl images verificationStatus costs rules')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/respond-info
 * Tenant responds to additional information request.
 */
exports.respondInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || !String(response).trim()) {
      return res.status(400).json({ message: 'A response message is required' });
    }

    const app = await Application.findById(id).populate('property', 'title');
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (String(app.tenant) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you are not the applicant' });
    }

    app.status = 'pending'; // moves back to pending review
    if (!app.additionalInfoRequest) {
      app.additionalInfoRequest = {};
    }
    app.additionalInfoRequest.response = String(response).trim();
    app.additionalInfoRequest.respondedAt = new Date();

    app.statusHistory.push({
      status: 'pending',
      by: req.user._id,
      changedAt: new Date(),
      note: `Tenant provided requested info: ${response}`
    });

    await app.save();

    // Notify landlord
    await createNotification({
      recipient: app.landlord,
      sender: req.user._id,
      type: 'application_submitted',
      title: 'Applicant Responded with Information',
      message: `${req.user.name || 'Tenant'} replied to your question for "${app.property?.title}".`,
      link: '/landlord'
    });

    const populated = await Application.findById(app._id)
      .populate('property', 'title address city state country rent imageUrl images verificationStatus costs rules')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

