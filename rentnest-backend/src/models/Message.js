// src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Link to the property the chat is about
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

    // Optional: link to a booking (if you want to group messages by booking request)
    booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

    content:  { type: String, required: true, trim: true },
    read:     { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes to make queries faster
messageSchema.index({ property: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
