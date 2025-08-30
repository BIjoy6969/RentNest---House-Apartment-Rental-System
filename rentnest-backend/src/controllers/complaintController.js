const Complaint = require('../models/Complaint');

exports.create = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) return res.status(400).json({ ok: false, message: 'Missing fields' });
    const c = await Complaint.create({ reporter: req.user._id, targetType, targetId, reason });
    res.status(201).json({ ok: true, complaint: c });
  } catch (e) { next(e); }
};
