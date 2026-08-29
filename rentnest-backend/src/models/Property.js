// src/models/Property.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  caption: { type: String, default: '' }
}, { _id: true });

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true, index: true },
  state: { type: String, default: '', trim: true },
  country: { type: String, required: true, default: 'Bangladesh' },
  rent: { type: Number, required: true, min: 0, index: true },
  bedrooms: { type: Number, required: true, min: 0 },
  bathrooms: { type: Number, required: true, min: 0 },
  amenities: [{ type: String, trim: true }],

  // Multiple property photos
  images: [imageSchema],

  // Fallback for single image backward compatibility
  imageUrl: { type: String },

  // Property categorization & real-world Bangladesh rental lifecycle
  propertyType: {
    type: String,
    enum: [
      'apartment', 'house', 'studio', 'villa', 'room', 'commercial',
      'family', 'bachelor', 'student', 'sublet', 'hostel', 'office', 'shop'
    ],
    default: 'apartment',
    index: true
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'rented', 'pending_review', 'unavailable'],
    default: 'available',
    index: true
  },

  // Formal verification state (Admin moderates: pending, approved, rejected, suspended)
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'approved', // Auto-approved on creation for portfolio/dev ease, admin can modify
    index: true
  },

  // Transparent Bangladesh Rental Cost Breakdown
  costs: {
    serviceCharge: { type: Number, default: 0 },
    parking: { type: Number, default: 0 },
    internet: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    gas: { type: Number, default: 0 },
    electricityEstimate: { type: Number, default: 0 },
    advanceMonths: { type: Number, default: 1 },
    securityDeposit: { type: Number, default: 0 }
  },

  // Rental Preferences & Rules
  rules: {
    familyAllowed: { type: Boolean, default: true },
    bachelorAllowed: { type: Boolean, default: true },
    studentAllowed: { type: Boolean, default: true },
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    minLeaseDurationMonths: { type: Number, default: 6 },
    preferredMoveInDate: { type: Date }
  },

  // Structured location & map support
  location: {
    area: { type: String, default: '', trim: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },

  // Price change audit trail
  priceHistory: [
    {
      rent: { type: Number, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],

  viewCount: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true, index: true },
  isFlagged: { type: Boolean, default: false, index: true },

  // Calculated listing completeness score (0-100)
  completenessScore: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for resolved primary image URL
propertySchema.virtual('primaryImage').get(function () {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    if (primary && primary.url) return primary.url;
    return this.images[0].url;
  }
  return this.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop';
});

// Virtual for total estimated monthly cost (Rent + Service Charge + Parking + Internet + Utilities)
propertySchema.virtual('totalMonthlyCost').get(function () {
  const c = this.costs || {};
  return (
    (this.rent || 0) +
    (c.serviceCharge || 0) +
    (c.parking || 0) +
    (c.internet || 0) +
    (c.water || 0) +
    (c.gas || 0) +
    (c.electricityEstimate || 0)
  );
});

// Virtual for estimated initial move-in cost (Advance + Security Deposit)
propertySchema.virtual('totalMoveInCost').get(function () {
  const c = this.costs || {};
  const advanceCost = (this.rent || 0) * (c.advanceMonths || 1);
  return advanceCost + (c.securityDeposit || 0);
});

// Compound indexes for optimal search and filtering performance
propertySchema.index({ city: 1, rent: 1, isActive: 1 });
propertySchema.index({ owner: 1, createdAt: -1 });
propertySchema.index({ status: 1, isActive: 1, isFlagged: 1 });
propertySchema.index({ verificationStatus: 1, isActive: 1 });

module.exports = mongoose.model('Property', propertySchema);
