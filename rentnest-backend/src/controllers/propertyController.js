const Property = require('../models/Property');

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body, owner: req.user._id };
    const prop = await Property.create(body);
    res.status(201).json({ ok: true, property: prop });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const prop = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, property: prop });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const prop = await Property.findOne({ _id: req.params.id, isActive: true, isFlagged: false })
      .populate('owner', 'name email role');
    if (!prop) return res.status(404).json({ ok: false, message: 'Property not found' });
    res.json({ ok: true, property: prop });
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { city, minRent, maxRent, bedrooms, q, page = 1, limit = 10, sort = 'createdAt' } = req.query;
    const filter = { isActive: true, isFlagged: false };
    if (city) filter.city = new RegExp(city, 'i');
    if (bedrooms) filter.bedrooms = { $gte: Number(bedrooms) };
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { address: new RegExp(q, 'i') }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Property.find(filter).sort({ [sort]: -1 }).skip(skip).limit(Number(limit)),
      Property.countDocuments(filter)
    ]);
    res.json({ ok: true, items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
};

exports.myProperties = async (req, res, next) => {
  try {
    const items = await Property.find({ owner: req.user._id });
    res.json({ ok: true, items });
  } catch (e) { next(e); }
};
