const Property = require('../models/Property');

// GET /api/properties
exports.getAll = async (req, res) => {
  try {
    const { location, minRent, maxRent } = req.query;
    const filter = {};

    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error('getAll error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/properties/:id
exports.getById = async (req, res) => {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop) return res.status(404).json({ message: 'Property not found' });
    res.json(prop);
  } catch (err) {
    console.error('getById error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/properties
exports.create = async (req, res) => {
  try {
    const { title, location, rent, bedrooms, description, image, landlordId } = req.body;
    const created = await Property.create({
      title, location, rent, bedrooms, description, image, landlordId: landlordId || null
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('create error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/properties/:id
exports.update = async (req, res) => {
  try {
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Property not found' });
    res.json(updated);
  } catch (err) {
    console.error('update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/properties/:id
exports.remove = async (req, res) => {
  try {
    const deleted = await Property.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Property not found' });
    res.json({ message: 'Property deleted' });
  } catch (err) {
    console.error('delete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
