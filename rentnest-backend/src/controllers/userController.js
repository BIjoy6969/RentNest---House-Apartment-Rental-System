// src/controllers/userController.js
const User = require('../models/User');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, password, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (avatar !== undefined) user.avatar = String(avatar).trim();
    if (password && password.length >= 6) user.password = password;

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('rentalPreferences');
    res.json(user?.rentalPreferences || {});
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/preferences
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const {
      preferredAreas,
      minBudget,
      maxBudget,
      preferredType,
      minBedrooms,
      preferredMoveInDate,
      needsParking,
      prefersFurnished
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.rentalPreferences) {
      user.rentalPreferences = {};
    }

    if (preferredAreas !== undefined) {
      user.rentalPreferences.preferredAreas = Array.isArray(preferredAreas)
        ? preferredAreas.map(s => String(s).trim()).filter(Boolean)
        : String(preferredAreas).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (minBudget !== undefined) user.rentalPreferences.minBudget = Number(minBudget);
    if (maxBudget !== undefined) user.rentalPreferences.maxBudget = Number(maxBudget);
    if (preferredType !== undefined) user.rentalPreferences.preferredType = String(preferredType).trim();
    if (minBedrooms !== undefined) user.rentalPreferences.minBedrooms = Number(minBedrooms);
    if (preferredMoveInDate !== undefined) user.rentalPreferences.preferredMoveInDate = preferredMoveInDate ? new Date(preferredMoveInDate) : null;
    if (needsParking !== undefined) user.rentalPreferences.needsParking = !!needsParking;
    if (prefersFurnished !== undefined) user.rentalPreferences.prefersFurnished = !!prefersFurnished;

    await user.save();
    res.json(user.rentalPreferences);
  } catch (err) {
    next(err);
  }
};

