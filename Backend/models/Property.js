const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  rent: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  description: String,
  image: String
});

module.exports = mongoose.model('Property', propertySchema);
