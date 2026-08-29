// src/controllers/applicationController.js
const Application = require('../models/Application');
const Property = require('../models/Property');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');

function computeScore(form = {}, rent = 1000) {
  const incomeMonthly = Number(form.incomeMonthly) || 0;
  const creditScore = Number(form.creditScore) || 600;
  const occupants = Number(form.occupants) || 1;

  const incomeRatio = rent > 0 ? Math.min(incomeMonthly / (rent * 3), 1) : 0.5;
  const credit = Math.max(Math.min((creditScore - 500) / 350, 1), 0);
  const occPenalty = Math.max(0, (occupants - 2) * 0.1);
  const rawScore = (incomeRatio * 0.6 + credit * 0.4) - occPenalty;
  return Math.round(Math.max(0, Math.min(1, rawScore)) * 100);
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

    if (prop.status === 'rented') {
      return res.status(400).json({ message: 'This property has already been rented' });
    }

    // Landlord cannot apply to own property
    if (String(prop.owner) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot submit a rental application for your own property' });
    }

    // Prevent duplicate active pending applications
    const existing = await Application.findOne({
      property: prop._id,
      tenant: req.user._id,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({
        message: 'You already have a pending rental application for this property'
      });
    }

    const score = computeScore(form || {}, prop.rent);

    const application = await Application.create({
      property: prop._id,
      tenant: req.user._id,
      landlord: prop.owner,
      form: {
        incomeMonthly: form?.incomeMonthly ? Number(form.incomeMonthly) : 0,
        employmentStatus: form?.employmentStatus ? String(form.employmentStatus).trim() : '',
        creditScore: form?.creditScore ? Number(form.creditScore) : 650,
        occupants: form?.occupants ? Number(form.occupants) : 1,
        pets: !!form?.pets,
        message: form?.message ? String(form.message).trim() : ''
      },
      score,
      status: 'pending',
      statusHistory: [{ status: 'pending', by: req.user._id, changedAt: new Date() }]
    });

    // Notify landlord of application
    await createNotification({
      recipient: prop.owner,
      sender: req.user._id,
      type: 'application_submitted',
      title: 'New Rental Application',
      message: `${req.user.name || 'A tenant'} submitted a screening application (Score: ${score}/100) for "${prop.title}".`,
      link: '/landlord'
    });

    const populated = await Application.findById(application._id)
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

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
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

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
      .populate('property', 'title address city state country rent imageUrl images owner')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

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
      incomeVsRent: app.form?.incomeMonthly && app.property?.rent
        ? Number((app.form.incomeMonthly / app.property.rent).toFixed(2))
        : null,
      creditScore: app.form?.creditScore ?? null,
      occupants: app.form?.occupants ?? null,
      pets: app.form?.pets ?? null
    };

    res.json({ application: app, screening });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/status
 * Landlord or Admin approves or rejects application.
 */
exports.setStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, updatePropertyStatus = false } = req.body;

    const allowed = ['pending', 'approved', 'rejected', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
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

    app.status = status;
    app.statusHistory.push({ status, by: req.user._id, changedAt: new Date() });
    await app.save();

    // If application approved and requested, update property availability status
    if (status === 'approved' && updatePropertyStatus && app.property) {
      await Property.findByIdAndUpdate(app.property._id, { status: 'reserved' });
    }

    // Notify tenant of status outcome
    await createNotification({
      recipient: app.tenant,
      sender: req.user._id,
      type: 'application_status',
      title: `Rental Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your rental application for "${app.property?.title || 'Property'}" has been ${status}.`,
      link: '/tenant'
    });

    const populated = await Application.findById(app._id)
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};
