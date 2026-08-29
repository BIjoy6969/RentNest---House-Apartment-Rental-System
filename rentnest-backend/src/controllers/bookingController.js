// src/controllers/bookingController.js
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');

/**
 * POST /api/bookings
 * Tenant creates a viewing booking.
 */
exports.create = async (req, res, next) => {
  try {
    const { property, propertyId, scheduledAt, note } = req.body;
    const targetPropId = property || propertyId;

    if (!targetPropId || !scheduledAt) {
      return res.status(400).json({ message: 'Property and scheduled date/time are required' });
    }

    if (!mongoose.isValidObjectId(targetPropId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const bookingDate = new Date(scheduledAt);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date/time format' });
    }

    // Must be in the future
    if (bookingDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled viewing date must be in the future' });
    }

    const prop = await Property.findById(targetPropId);
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ message: 'Property is not available for booking' });
    }

    if (prop.status === 'rented') {
      return res.status(400).json({ message: 'This property has already been rented' });
    }

    // Prevent landlords from booking their own properties
    if (String(prop.owner) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot book a viewing for your own property' });
    }

    // Check for duplicate pending booking by same tenant on same property
    const existingPending = await Booking.findOne({
      property: prop._id,
      tenant: req.user._id,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({
        message: 'You already have a pending viewing request for this property'
      });
    }

    // 30-minute time slot conflict detection on the same property
    const conflictWindowMs = 30 * 60 * 1000;
    const windowStart = new Date(bookingDate.getTime() - conflictWindowMs);
    const windowEnd = new Date(bookingDate.getTime() + conflictWindowMs);

    const conflictingBooking = await Booking.findOne({
      property: prop._id,
      status: { $in: ['pending', 'approved'] },
      scheduledAt: { $gte: windowStart, $lte: windowEnd }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        message: 'Another viewing is already requested or scheduled around this time slot. Please choose another time.'
      });
    }

    const booking = await Booking.create({
      property: prop._id,
      tenant: req.user._id,
      landlord: prop.owner,
      scheduledAt: bookingDate,
      note: note ? String(note).trim() : '—',
      status: 'pending'
    });

    // Notify landlord of new booking
    await createNotification({
      recipient: prop.owner,
      sender: req.user._id,
      type: 'booking_created',
      title: 'New Viewing Request',
      message: `${req.user.name || 'A tenant'} requested a viewing for "${prop.title}" on ${bookingDate.toLocaleDateString()} at ${bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      link: '/landlord'
    });

    const populated = await Booking.findById(booking._id)
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/mine (and /me)
 * Tenant: view own bookings history.
 */
exports.mine = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('landlord', 'name email');

    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/incoming
 * Landlord: incoming booking requests for owned properties.
 */
exports.incoming = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ landlord: req.user._id })
      .sort({ createdAt: -1 })
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email');

    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/bookings/:id/status
 * Landlord / Admin: update booking status with state machine transitions & notification.
 */
exports.setStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['approved', 'rejected', 'cancelled', 'completed', 'pending'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(id).populate('property', 'title');
    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    const isLandlord = String(booking.landlord) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isLandlord && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only the landlord can update this booking' });
    }

    // State machine validation
    if (['rejected', 'cancelled'].includes(booking.status) && status === 'approved') {
      return res.status(400).json({ message: `Cannot approve a booking that is already ${booking.status}` });
    }
    if (booking.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be changed' });
    }

    booking.status = status;
    await booking.save();

    // Notify tenant of booking status change
    await createNotification({
      recipient: booking.tenant,
      sender: req.user._id,
      type: 'booking_status',
      title: `Viewing Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your tour viewing for "${booking.property?.title || 'Property'}" has been ${status}.`,
      link: '/tenant'
    });

    const populated = await Booking.findById(booking._id)
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/bookings/:id/cancel
 * Tenant or Landlord: cancel a booking.
 */
exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('property', 'title');
    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    const isTenant = String(booking.tenant) === String(req.user._id);
    const isLandlord = String(booking.landlord) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you are not a party to this booking' });
    }

    if (['rejected', 'cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Notify the other party
    const targetRecipient = isTenant ? booking.landlord : booking.tenant;
    await createNotification({
      recipient: targetRecipient,
      sender: req.user._id,
      type: 'booking_cancelled',
      title: 'Viewing Cancelled',
      message: `The viewing for "${booking.property?.title || 'Property'}" was cancelled by ${req.user.name || 'user'}.`,
      link: isTenant ? '/landlord' : '/tenant'
    });

    const populated = await Booking.findById(booking._id)
      .populate('property', 'title address city state country rent imageUrl images')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};
