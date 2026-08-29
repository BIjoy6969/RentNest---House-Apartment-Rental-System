// src/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    // Bangladesh-relevant tenant screening form
    form: {
      incomeMonthly: { type: Number, required: true, min: 0 },
      employmentStatus: { type: String, default: 'Employed' },
      occupation: { type: String, default: '' },
      occupants: { type: Number, default: 1, min: 1 },
      preferredMoveInDate: { type: Date },
      nidOrPassport: { type: String, default: '' },
      emergencyContact: { type: String, default: '' },
      pets: { type: Boolean, default: false },
      message: { type: String, default: '' },
      landlordRating: { type: Number, min: 1, max: 5, default: 5 }
    },

    // Automated Screening Match Score (0-100)
    score: { type: Number, default: 0 },

    // Application Lifecycle
    status: {
      type: String,
      enum: ['pending', 'info_requested', 'approved', 'rejected', 'withdrawn', 'cancelled'],
      default: 'pending',
      index: true
    },

    // Rejection details with structured reason category
    rejectionReason: {
      category: {
        type: String,
        enum: [
          'rental_requirements_not_met',
          'property_no_longer_available',
          'application_incomplete',
          'move_in_date_mismatch',
          'another_applicant_selected',
          'applicant_withdrew',
          'other'
        ]
      },
      explanation: { type: String, default: '' },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      decidedAt: { type: Date }
    },

    // Landlord Request for Additional Information
    additionalInfoRequest: {
      message: { type: String, default: '' },
      requestedAt: { type: Date },
      response: { type: String, default: '' },
      respondedAt: { type: Date }
    },

    // Complete audit history
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' }
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

