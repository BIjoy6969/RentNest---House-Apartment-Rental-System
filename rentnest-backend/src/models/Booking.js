// src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    scheduledAt: { type: Date, required: true, index: true },
    note: { type: String, default: '—' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true
    }
  },
  { timestamps: true }
);

// Indexes for conflict detection and dashboards
bookingSchema.index({ landlord: 1, createdAt: -1 });
bookingSchema.index({ tenant: 1, createdAt: -1 });
bookingSchema.index({ property: 1, scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);