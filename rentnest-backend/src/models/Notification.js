// src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_status',
        'booking_cancelled',
        'tour_decision',
        'application_submitted',
        'application_status',
        'application_info_requested',
        'application_withdrawn',
        'message',
        'property_status',
        'property_verified',
        'price_drop',
        'property_available',
        'system'
      ],
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    relatedEntity: {
      entityType: { type: String, enum: ['property', 'booking', 'application', 'tour_decision', 'user', 'complaint'], default: null },
      id: { type: mongoose.Schema.Types.ObjectId, default: null }
    },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

