const User = require('../models/User');

exports.addFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: propertyId } }, { new: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: propertyId } }, { new: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.myFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json({ ok: true, favorites: user.favorites || [] });
  } catch (e) { next(e); }
};
