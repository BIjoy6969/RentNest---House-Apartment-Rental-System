// src/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    form: {
      incomeMonthly: { type: Number, required: true, min: 0 },
      employmentStatus: { type: String, default: '' },
      creditScore: { type: Number, default: 650 },
      occupants: { type: Number, default: 1, min: 1 },
      pets: { type: Boolean, default: false },
      message: { type: String, default: '' }
    },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ]
  },
  { timestamps: true }
);

// Indexes for duplicate prevention and query optimization
applicationSchema.index({ property: 1, tenant: 1, status: 1 });
applicationSchema.index({ landlord: 1, createdAt: -1 });
applicationSchema.index({ tenant: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
