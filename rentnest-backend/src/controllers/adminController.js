// src/controllers/adminController.js
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Application = require('../models/Application');
const Complaint = require('../models/Complaint');
const { ALL } = require('../constants/roles');

/**
 * GET /api/admin/stats
 * Real platform metrics.
 */
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      tenantCount,
      landlordCount,
      totalProperties,
      activeProperties,
      flaggedProperties,
      totalBookings,
      pendingBookings,
      totalApplications,
      pendingApplications,
      totalComplaints,
      openComplaints
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'tenant' }),
      User.countDocuments({ role: 'landlord' }),
      Property.countDocuments(),
      Property.countDocuments({ isActive: true, isFlagged: false }),
      Property.countDocuments({ isFlagged: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' })
    ]);

    res.json({
      users: { total: totalUsers, tenants: tenantCount, landlords: landlordCount },
      properties: { total: totalProperties, active: activeProperties, flagged: flaggedProperties },
      bookings: { total: totalBookings, pending: pendingBookings },
      applications: { total: totalApplications, pending: pendingApplications },
      complaints: { total: totalComplaints, open: openComplaints }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Users
 */
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    if (role && !ALL.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = String(email).toLowerCase().trim();
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ ok: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * Properties
 */
exports.listProperties = async (req, res, next) => {
  try {
    const properties = await Property.find()
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    next(err);
  }
};

exports.flagProperty = async (req, res, next) => {
  try {
    const prop = await Property.findByIdAndUpdate(req.params.id, { isFlagged: true }, { new: true });
    if (!prop) return res.status(404).json({ message: 'Property not found' });
    res.json(prop);
  } catch (err) {
    next(err);
  }
};

exports.unflagProperty = async (req, res, next) => {
  try {
    const prop = await Property.findByIdAndUpdate(req.params.id, { isFlagged: false }, { new: true });
    if (!prop) return res.status(404).json({ message: 'Property not found' });
    res.json(prop);
  } catch (err) {
    next(err);
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop) return res.status(404).json({ message: 'Property not found' });
    await prop.deleteOne();
    res.json({ ok: true, message: 'Property deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * Complaints
 */
exports.listComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find()
      .populate('reporter', 'name email role')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    next(err);
  }
};

exports.setComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid complaint status' });
    }
    const c = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('reporter', 'name email role');
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    res.json(c);
  } catch (err) {
    next(err);
  }
};

/**
 * Applications
 */
exports.listApplications = async (req, res, next) => {
  try {
    const apps = await Application.find()
      .populate('property', 'title address city state rent')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    next(err);
  }
};
