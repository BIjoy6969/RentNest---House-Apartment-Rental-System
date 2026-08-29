// src/services/notificationService.js
const Notification = require('../models/Notification');

/**
 * Creates a notification asynchronously without blocking the primary request workflow.
 */
exports.createNotification = async ({ recipient, sender, type, title, message, link = '' }) => {
  try {
    if (!recipient || !type || !title || !message) return null;

    // Don't notify yourself
    if (sender && String(recipient) === String(sender)) return null;

    const notif = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title,
      message,
      link,
      read: false
    });
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};
