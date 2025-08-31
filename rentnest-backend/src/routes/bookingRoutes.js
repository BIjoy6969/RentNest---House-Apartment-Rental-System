// src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();

const Booking = require('../models/Booking');
const Property = require('../models/Property');

// Robust auth import (supports default export or { auth })
const authMod = require('../middleware/auth');
const auth = typeof authMod === 'function' ? authMod : authMod.auth;

/** Allow one or more roles */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

/**
 * POST /api/bookings
 * Tenant creates a booking
 * body: { property, scheduledAt, note }
 */
router.post('/', auth, requireRole('tenant'), async (req, res) => {
  try {
    const { property, scheduledAt, note } = req.body;
    if (!property || !scheduledAt) {
      return res.status(400).json({ message: 'property and scheduledAt are required' });
    }

    const p = await Property.findById(property).select('_id owner isActive isFlagged');
    if (!p || !p.isActive || p.isFlagged) {
      return res.status(404).json({ message: 'Property not available' });
    }

    const doc = await Booking.create({
      property: p._id,
      tenant: req.user.id,
      landlord: p.owner,  // relies on Property having an `owner` field
      scheduledAt,
      note: note || '—',
      status: 'pending',
    });

    const populated = await Booking.findById(doc._id)
      .populate('property', 'title address city state country rent')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');

    res.status(201).json(populated);
  } catch (e) {
    console.error("Booking creation error:", e);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

/**
 * GET /api/bookings/mine
 * Tenant booking history
 */
router.get('/mine', auth, requireRole('tenant'), async (req, res) => {
  try {
    const list = await Booking.find({ tenant: req.user.id })
      .sort({ createdAt: -1 })
      .populate('property', 'title address city state country rent')
      .populate('landlord', 'name email');
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

/**
 * (Legacy alias) GET /api/bookings/me
 */
router.get('/me', auth, requireRole('tenant'), async (req, res) => {
  try {
    const list = await Booking.find({ tenant: req.user.id })
      .sort({ createdAt: -1 })
      .populate('property', 'title address city state country rent')
      .populate('landlord', 'name email');
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

/**
 * GET /api/bookings/incoming
 * Landlord: incoming booking requests for their properties
 */
router.get('/incoming', auth, requireRole('landlord'), async (req, res) => {
  try {
    const list = await Booking.find({ landlord: req.user.id })
      .sort({ createdAt: -1 })
      .populate('property', 'title city state')
      .populate('tenant', 'name email');
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load incoming bookings' });
  }
});

/**
 * PATCH /api/bookings/:id/status
 * Landlord updates a booking status: approved | rejected | pending | cancelled
 */
router.patch('/:id/status', auth, requireRole('landlord'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['approved', 'rejected', 'pending', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Not found' });
    if (String(b.landlord) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    b.status = status;
    await b.save();

    const populated = await Booking.findById(b._id)
      .populate('property', 'title city state')
      .populate('tenant', 'name email');

    res.json(populated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

module.exports = router;
