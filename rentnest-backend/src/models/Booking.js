// src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property:  { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    landlord:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true }, // owner of the property

    scheduledAt: { type: Date, required: true },
    note:        { type: String }, // optional
    status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

// Helpful indexes for your dashboards
bookingSchema.index({ landlord: 1, createdAt: -1 });
bookingSchema.index({ tenant: 1,   createdAt: -1 });
bookingSchema.index({ property: 1, scheduledAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
