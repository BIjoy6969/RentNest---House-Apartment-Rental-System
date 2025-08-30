const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    form: {
      incomeMonthly: { type: Number, required: true },
      employmentStatus: { type: String, default: '' },
      creditScore: { type: Number, default: 600 },
      occupants: { type: Number, default: 1 },
      pets: { type: Boolean, default: false },
      message: { type: String, default: '' }
    },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
