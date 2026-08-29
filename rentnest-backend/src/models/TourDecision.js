// src/models/TourDecision.js
const mongoose = require('mongoose');

const tourDecisionSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Tenant Post-Tour Decision
    tenantDecision: {
      status: {
        type: String,
        enum: ['pending', 'interested', 'not_interested', 'need_more_time'],
        default: 'pending',
        index: true
      },
      reasonCategory: {
        type: String,
        enum: [
          'rent_too_high',
          'location_not_suitable',
          'property_condition',
          'amenities_dont_match',
          'found_another_property',
          'landlord_communication_issue',
          'other',
          null
        ],
        default: null
      },
      explanation: { type: String, default: '' },
      decidedAt: { type: Date, default: null }
    },

    // Landlord Feedback / Consideration
    landlordDecision: {
      status: {
        type: String,
        enum: ['pending', 'considering', 'not_interested'],
        default: 'pending'
      },
      reasonCategory: { type: String, default: null },
      explanation: { type: String, default: '' },
      decidedAt: { type: Date, default: null }
    },

    // Audit trail of state transitions and reasons
    history: [
      {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        actorRole: { type: String, enum: ['tenant', 'landlord', 'admin'], required: true },
        action: { type: String, required: true },
        status: { type: String, required: true },
        reasonCategory: { type: String, default: null },
        explanation: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

tourDecisionSchema.index({ property: 1, tenant: 1 });
tourDecisionSchema.index({ landlord: 1, createdAt: -1 });

module.exports = mongoose.model('TourDecision', tourDecisionSchema);
