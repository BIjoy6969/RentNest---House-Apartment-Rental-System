// src/controllers/complaintController.js
const Complaint = require('../models/Complaint');

/**
 * POST /api/complaints
 * Submit a complaint/report for a property or user.
 */
exports.create = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId, and reason are required' });
    }

    if (!['property', 'user'].includes(targetType)) {
      return res.status(400).json({ message: 'targetType must be property or user' });
    }

    const complaint = await Complaint.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason: String(reason).trim(),
      status: 'open'
    });

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/complaints/mine
 * View my submitted complaints.
 */
exports.mine = async (req, res, next) => {
  try {
    const list = await Complaint.find({ reporter: req.user._id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};
