const Property = require('../models/Property');

exports.getProperties = async (req, res) => {
  try {
    const { location, minRent, maxRent } = req.query;
    let filter = {};

    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minRent || maxRent) filter.rent = {};
    if (minRent) filter.rent.$gte = Number(minRent);
    if (maxRent) filter.rent.$lte = Number(maxRent);

    const properties = await Property.find(filter);
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
