// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    // User role (supports tenant, landlord, admin for admin panel)
    role: { type: String, enum: ['tenant', 'landlord', 'admin'], required: true, default: 'tenant' },

    phone: { type: String, default: '', trim: true },
    avatar: { type: String, default: '' },

    // Verification state
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'suspended'],
      default: 'unverified',
      index: true
    },
    isSuspended: { type: Boolean, default: false, index: true },

    // Landlord Trust & Reputation metrics (calculated & updated transparently)
    trustScore: {
      score: { type: Number, default: 0 }, // 0-100 score
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      responseRate: { type: Number, default: 100 }, // percentage
      completedRentals: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 } // percentage
    },

    // Tenant Rental Preferences (used for smart matching & recommendations)
    rentalPreferences: {
      preferredAreas: [{ type: String, trim: true }],
      minBudget: { type: Number, default: 0 },
      maxBudget: { type: Number, default: 100000 },
      preferredType: { type: String, default: '' },
      minBedrooms: { type: Number, default: 1 },
      preferredMoveInDate: { type: Date },
      needsParking: { type: Boolean, default: false },
      prefersFurnished: { type: Boolean, default: false }
    },

    // Wishlist: tenant favorites
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password with hash
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
