// src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  scheduledAt: { type: Date, required: true },
  note: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
