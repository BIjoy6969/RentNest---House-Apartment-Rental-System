// src/models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['property', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
