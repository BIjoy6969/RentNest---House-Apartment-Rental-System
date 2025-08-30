// src/models/Property.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  rent: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  amenities: [String],  // List of amenities like "Lift", "Generator"
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);
