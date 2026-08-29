// src/controllers/messageController.js
const Message = require('../models/Message');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

/**
 * POST /api/messages
 * Send a message.
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { propertyId, receiverId, content, bookingId } = req.body;

    if (!propertyId || !receiverId || !content || !String(content).trim()) {
      return res.status(400).json({ message: 'propertyId, receiverId, and content are required' });
    }

    if (!mongoose.isValidObjectId(propertyId) || !mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ message: 'Invalid ID provided' });
    }

    const prop = await Property.findById(propertyId);
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ message: 'Property not available for messaging' });
    }

    if (bookingId && mongoose.isValidObjectId(bookingId)) {
      const bk = await Booking.findById(bookingId);
      if (bk) {
        const participantIds = [String(bk.tenant), String(bk.landlord)];
        const senderOk = participantIds.includes(String(req.user._id));
        const receiverOk = participantIds.includes(String(receiverId));
        if (!senderOk || !receiverOk) {
          return res.status(403).json({ message: 'Not a participant of this booking' });
        }
      }
    }

    const msg = await Message.create({
      property: propertyId,
      booking: bookingId || undefined,
      sender: req.user._id,
      receiver: receiverId,
      content: String(content).trim(),
      read: false
    });

    const populated = await Message.findById(msg._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/messages/inbox
 * Recent messages involving the current user.
 */
exports.inbox = async (req, res, next) => {
  try {
    const uid = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: uid }, { receiver: uid }]
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('property', 'title city');

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/messages/thread
 * Message thread between current user and peer for a property.
 */
exports.thread = async (req, res, next) => {
  try {
    const { propertyId, withUserId } = req.query;
    if (!propertyId || !withUserId) {
      return res.status(400).json({ message: 'propertyId and withUserId are required' });
    }

    if (!mongoose.isValidObjectId(propertyId) || !mongoose.isValidObjectId(withUserId)) {
      return res.status(400).json({ message: 'Invalid ID provided' });
    }

    const thread = await Message.find({
      property: propertyId,
      $or: [
        { sender: req.user._id, receiver: withUserId },
        { sender: withUserId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.json(thread);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/messages/:id/read
 * Mark message as read.
 */
exports.markRead = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.receiver) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the receiver can mark this message as read' });
    }
    msg.read = true;
    await msg.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
