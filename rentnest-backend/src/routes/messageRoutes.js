// src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

/**
 * POST /api/messages
 * Send a message.
 * body: { propertyId, receiverId, content, bookingId? }
 */
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, receiverId, content, bookingId } = req.body;

    if (!propertyId || !receiverId || !content || !String(content).trim()) {
      return res.status(400).json({ message: 'propertyId, receiverId, and content are required' });
    }

    // Ensure property exists and is available (avoid chatting on flagged/inactive listing)
    const prop = await Property.findById(propertyId).select('_id owner isActive isFlagged');
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ message: 'Property not available' });
    }

    // If bookingId is provided, ensure it references this property and both participants belong
    if (bookingId) {
      const bk = await Booking.findById(bookingId).select('property tenant landlord');
      if (!bk || String(bk.property) !== String(propertyId)) {
        return res.status(400).json({ message: 'Invalid booking reference' });
      }
      const participantIds = [String(bk.tenant), String(bk.landlord)];
      const senderOk = participantIds.includes(String(req.user.id));
      const receiverOk = participantIds.includes(String(receiverId));
      if (!senderOk || !receiverOk) {
        return res.status(403).json({ message: 'Not a participant of this booking' });
      }
    }

    const msg = await Message.create({
      property: propertyId,
      booking: bookingId || undefined,
      sender: req.user.id,
      receiver: receiverId,
      content: String(content).trim(),
    });

    // Return populated minimal info for UI
    const populated = await Message.findById(msg._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

/**
 * GET /api/messages/inbox
 * Recent messages involving the current user (last 50),
 * populated with counterpart minimal fields for UI rendering.
 */
router.get('/inbox', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: uid }, { receiver: uid }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load inbox' });
  }
});

/**
 * GET /api/messages/thread
 * Query-based thread endpoint (preferred).
 * query: ?propertyId=...&withUserId=...  [&bookingId=...]
 */
router.get('/thread', auth, async (req, res) => {
  try {
    const { propertyId, withUserId, bookingId } = req.query;
    if (!propertyId || !withUserId) {
      return res.status(400).json({ message: 'propertyId and withUserId are required' });
    }

    const filter = {
      property: propertyId,
      $or: [
        { sender: req.user.id, receiver: withUserId },
        { sender: withUserId, receiver: req.user.id },
      ],
    };
    if (bookingId) filter.booking = bookingId;

    const thread = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.json(thread);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load thread' });
  }
});

/**
 * GET /api/messages/thread/:userId
 * Legacy route kept for backward compatibility.
 * Requires ?propertyId=... [&bookingId=...]
 */
router.get('/thread/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { propertyId, bookingId } = req.query;
    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required' });
    }

    const filter = {
      property: propertyId,
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    };
    if (bookingId) filter.booking = bookingId;

    const thread = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.json(thread);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load thread' });
  }
});

/**
 * PATCH /api/messages/:id/read
 * Mark a single message as read (only receiver can mark).
 */
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (String(msg.receiver) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the receiver can mark as read' });
    }
    msg.read = true;
    await msg.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

module.exports = router;
