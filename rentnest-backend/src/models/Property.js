const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // landlord
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  rent: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  amenities: [String],
  imageUrl: { type: String }, // Stores the URL path of the uploaded image
  isActive: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false } // admin moderation
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);
