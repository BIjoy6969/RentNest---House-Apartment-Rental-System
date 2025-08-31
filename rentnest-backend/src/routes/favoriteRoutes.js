// src/routes/favoriteRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const User = require('../models/User');
const Property = require('../models/Property');

// robust auth import
const authMod = require('../middleware/auth');
const auth = typeof authMod === 'function' ? authMod : authMod.auth;

/**
 * GET /api/favorites/mine
 * Query param: ?populated=1 to return full property docs
 */
router.get('/mine', auth, async (req, res) => {
  try {
    const populated = req.query.populated && req.query.populated !== '0';
    if (populated) {
      const me = await User.findById(req.user.id)
        .select('favorites')
        .populate({
          path: 'favorites',
          match: { isActive: true, isFlagged: { $ne: true } },
          select: 'title city state country rent bedrooms bathrooms imageUrl createdAt',
          options: { sort: { createdAt: -1 } },
        });
      return res.json(me?.favorites || []);
    } else {
      const me = await User.findById(req.user.id).select('favorites');
      return res.json(me?.favorites || []);
    }
  } catch (e) {
    console.error('GET /favorites/mine error:', e);
    res.status(500).json({ message: 'Failed to load favorites' });
  }
});

/**
 * POST /api/favorites/:propertyId
 * Add a property to current user's favorites (idempotent)
 */
router.post('/:propertyId', auth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ message: 'Invalid property id' });
    }

    const prop = await Property.findById(propertyId).select('_id isActive isFlagged');
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ message: 'Property not available' });
    }

    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { favorites: prop._id } } // add only if not already present
    );

    const me = await User.findById(req.user.id).select('favorites');
    res.json({ ok: true, favorites: me?.favorites || [] });
  } catch (e) {
    console.error('POST /favorites/:propertyId error:', e);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

/**
 * DELETE /api/favorites/:propertyId
 * Remove a property from favorites (idempotent)
 */
router.delete('/:propertyId', auth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ message: 'Invalid property id' });
    }

    await User.updateOne(
      { _id: req.user.id },
      { $pull: { favorites: propertyId } }
    );

    const me = await User.findById(req.user.id).select('favorites');
    res.json({ ok: true, favorites: me?.favorites || [] });
  } catch (e) {
    console.error('DELETE /favorites/:propertyId error:', e);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

module.exports = router;
