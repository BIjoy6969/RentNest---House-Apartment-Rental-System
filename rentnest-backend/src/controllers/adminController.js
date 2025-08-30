const User = require('../models/User');
const Property = require('../models/Property');
const Complaint = require('../models/Complaint');
const { ALL } = require('../constants/roles');

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ ok: true, users });
  } catch (e) { next(e); }
};

exports.setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!ALL.includes(role)) return res.status(400).json({ ok: false, message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json({ ok: true, user });
  } catch (e) { next(e); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.listProperties = async (req, res, next) => {
  try {
    const props = await Property.find();
    res.json({ ok: true, properties: props });
  } catch (e) { next(e); }
};

exports.flagProperty = async (req, res, next) => {
  try {
    const { flagged } = req.body;
    const prop = await Property.findByIdAndUpdate(req.params.id, { isFlagged: !!flagged }, { new: true });
    res.json({ ok: true, property: prop });
  } catch (e) { next(e); }
};

exports.listComplaints = async (req, res, next) => {
  try {
    const list = await Complaint.find().sort({ createdAt: -1 });
    res.json({ ok: true, complaints: list });
  } catch (e) { next(e); }
};

exports.setComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'in_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'Invalid status' });
    }
    const c = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ ok: true, complaint: c });
  } catch (e) { next(e); }
};
