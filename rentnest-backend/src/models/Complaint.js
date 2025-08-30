const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['user', 'property', 'message'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'dismissed'], default: 'open' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
