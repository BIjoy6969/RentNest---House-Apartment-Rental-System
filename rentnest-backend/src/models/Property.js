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
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'Bangladesh' },
  rent: { type: Number, required: true, min: 0, index: true },
  bedrooms: { type: Number, required: true, min: 0 },
  bathrooms: { type: Number, required: true, min: 0 },
  amenities: [{ type: String, trim: true }],

  // Multiple property photos
  images: [imageSchema],

  // Fallback for single image backward compatibility
  imageUrl: { type: String },

  // Property categorization & real-world lifecycle
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'studio', 'villa', 'room', 'commercial'],
    default: 'apartment',
    index: true
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'rented', 'pending_review'],
    default: 'available',
    index: true
  },
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

// Compound indexes for optimal search and filtering performance
propertySchema.index({ city: 1, rent: 1, isActive: 1 });
propertySchema.index({ owner: 1, createdAt: -1 });
propertySchema.index({ status: 1, isActive: 1, isFlagged: 1 });

module.exports = mongoose.model('Property', propertySchema);
