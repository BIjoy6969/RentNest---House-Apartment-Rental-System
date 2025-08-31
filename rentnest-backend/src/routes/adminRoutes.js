// src/routes/adminRoutes.js
const router = require('express').Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Complaint = require('../models/Complaint');

// robust auth import (supports default export or {auth})
const authMod = require('../middleware/auth');
const auth = typeof authMod === 'function' ? authMod : authMod.auth;

// local role guard
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

router.use(auth, requireRole('admin'));

/* ---------- Users ---------- */
router.get('/users', async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.put('/users/:id', async (req, res) => {
  const { name, email, role } = req.body;
  const doc = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role },
    { new: true }
  ).select('-password');
  if (!doc) return res.status(404).json({ message: 'User not found' });
  res.json(doc);
});

router.delete('/users/:id', async (req, res) => {
  const doc = await User.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'User not found' });
  await doc.deleteOne();
  res.json({ ok: true });
});

/* ---------- Properties ---------- */
router.get('/properties', async (_req, res) => {
  const list = await Property.find().populate('owner', 'name email role').sort({ createdAt: -1 });
  res.json(list);
});

router.patch('/properties/:id/flag', async (req, res) => {
  const doc = await Property.findByIdAndUpdate(req.params.id, { isFlagged: true }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Property not found' });
  res.json(doc);
});

router.patch('/properties/:id/unflag', async (req, res) => {
  const doc = await Property.findByIdAndUpdate(req.params.id, { isFlagged: false }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Property not found' });
  res.json(doc);
});

router.delete('/properties/:id', async (req, res) => {
  const doc = await Property.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Property not found' });
  await doc.deleteOne();
  res.json({ ok: true });
});

/* ---------- Complaints ---------- */
router.get('/complaints', async (_req, res) => {
  const list = await Complaint.find()
    .populate('reporter', 'name email role')
    .sort({ createdAt: -1 });
  res.json(list);
});

router.patch('/complaints/:id/status', async (req, res) => {
  const { status } = req.body; // open / resolved / dismissed
  if (!['open', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const doc = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Complaint not found' });
  res.json(doc);
});

module.exports = router;
