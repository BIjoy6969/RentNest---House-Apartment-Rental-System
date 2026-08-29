// src/controllers/tourDecisionController.js
const TourDecision = require('../models/TourDecision');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');

/**
 * POST /api/tour-decisions
 * Tenant submits post-tour decision (Interested / Not Interested / Need More Time).
 */
exports.submitTenantDecision = async (req, res, next) => {
  try {
    const { bookingId, status, reasonCategory, explanation } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({ message: 'bookingId and decision status are required' });
    }

    const validStatuses = ['interested', 'not_interested', 'need_more_time'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (status === 'not_interested' && !reasonCategory) {
      return res.status(400).json({ message: 'A reason category is required when rejecting a property after viewing' });
    }

    const booking = await Booking.findById(bookingId).populate('property', 'title owner');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify tenant ownership
    if (String(booking.tenant) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you are not the tenant of this viewing' });
    }

    // Tour must be in a decided/completed state or approved past scheduled date
    if (!['completed', 'approved'].includes(booking.status)) {
      return res.status(400).json({ message: 'You can only record a decision for an approved or completed tour' });
    }

    // Find or create tour decision record
    let decision = await TourDecision.findOne({ booking: booking._id });
    if (!decision) {
      decision = new TourDecision({
        booking: booking._id,
        property: booking.property._id,
        tenant: req.user._id,
        landlord: booking.landlord
      });
    }

    decision.tenantDecision = {
      status,
      reasonCategory: status === 'not_interested' ? reasonCategory : null,
      explanation: explanation ? String(explanation).trim() : '',
      decidedAt: new Date()
    };

    decision.history.push({
      actor: req.user._id,
      actorRole: 'tenant',
      action: `Tenant marked post-tour decision as "${status}"`,
      status,
      reasonCategory: status === 'not_interested' ? reasonCategory : null,
      explanation: explanation ? String(explanation).trim() : '',
      timestamp: new Date()
    });

    await decision.save();

    // Auto-mark booking as completed if it was approved
    if (booking.status === 'approved') {
      booking.status = 'completed';
      await booking.save();
    }

    // Notify landlord of tenant decision
    let notifTitle = 'Tenant Post-Tour Feedback';
    let notifMsg = `${req.user.name || 'Tenant'} marked their viewing for "${booking.property?.title}" as: ${status.replace('_', ' ').toUpperCase()}.`;
    if (status === 'not_interested' && reasonCategory) {
      notifMsg += ` (Reason: ${reasonCategory.replace(/_/g, ' ')})`;
    }

    await createNotification({
      recipient: booking.landlord,
      sender: req.user._id,
      type: 'tour_decision',
      title: notifTitle,
      message: notifMsg,
      link: '/landlord'
    });

    const populated = await TourDecision.findById(decision._id)
      .populate('property', 'title address city rent imageUrl images')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('booking', 'scheduledAt status');

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tour-decisions/:id/landlord
 * Landlord responds with consideration status for this tenant's tour.
 */
exports.submitLandlordDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reasonCategory, explanation } = req.body;

    const validStatuses = ['considering', 'not_interested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid landlord decision status' });
    }

    const decision = await TourDecision.findById(id).populate('property', 'title');
    if (!decision) {
      return res.status(404).json({ message: 'Tour decision record not found' });
    }

    if (String(decision.landlord) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only the landlord can update this' });
    }

    decision.landlordDecision = {
      status,
      reasonCategory: reasonCategory || null,
      explanation: explanation ? String(explanation).trim() : '',
      decidedAt: new Date()
    };

    decision.history.push({
      actor: req.user._id,
      actorRole: 'landlord',
      action: `Landlord marked tenant consideration as "${status}"`,
      status,
      reasonCategory: reasonCategory || null,
      explanation: explanation ? String(explanation).trim() : '',
      timestamp: new Date()
    });

    await decision.save();

    // Notify tenant
    await createNotification({
      recipient: decision.tenant,
      sender: req.user._id,
      type: 'tour_decision',
      title: 'Landlord Updated Viewing Status',
      message: `The landlord updated their status regarding your tour for "${decision.property?.title}".`,
      link: '/tenant'
    });

    const populated = await TourDecision.findById(decision._id)
      .populate('property', 'title address city rent imageUrl images')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tour-decisions/mine
 * Tenant gets their tour decisions.
 */
exports.getMine = async (req, res, next) => {
  try {
    const decisions = await TourDecision.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .populate('property', 'title address city rent imageUrl images verificationStatus')
      .populate('landlord', 'name email phone verificationStatus')
      .populate('booking', 'scheduledAt status');

    res.json(decisions);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tour-decisions/landlord
 * Landlord gets all tour decisions for their listings.
 */
exports.getLandlordDecisions = async (req, res, next) => {
  try {
    const decisions = await TourDecision.find({ landlord: req.user._id })
      .sort({ createdAt: -1 })
      .populate('property', 'title address city rent imageUrl images')
      .populate('tenant', 'name email phone')
      .populate('booking', 'scheduledAt status');

    res.json(decisions);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tour-decisions/booking/:bookingId
 * Fetch decision by booking ID.
 */
exports.getByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const decision = await TourDecision.findOne({ booking: bookingId })
      .populate('property', 'title address city rent imageUrl images')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone');

    res.json(decision || null);
  } catch (err) {
    next(err);
  }
};
