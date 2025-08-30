const Booking = require('../models/Booking');
const Property = require('../models/Property');

exports.create = async (req, res, next) => {
  try {
    const { propertyId, scheduledAt, note } = req.body;
    const prop = await Property.findById(propertyId);
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ ok: false, message: 'Property not available' });
    }
    const booking = await Booking.create({
      property: prop._id,
      tenant: req.user._id,
      landlord: prop.owner,
      scheduledAt,
      note
    });
    res.status(201).json({ ok: true, booking });
  } catch (e) { next(e); }
};

exports.mine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'tenant'
      ? { tenant: req.user._id }
      : req.user.role === 'landlord'
      ? { landlord: req.user._id }
      : {}; // admin sees all
    const bookings = await Booking.find(filter)
      .populate('property', 'title city rent')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');
    res.json({ ok: true, bookings });
  } catch (e) { next(e); }
};

exports.approve = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ ok: false, message: 'Not found' });
    if (String(booking.landlord) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    booking.status = 'approved';
    await booking.save();
    res.json({ ok: true, booking });
  } catch (e) { next(e); }
};

exports.reject = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ ok: false, message: 'Not found' });
    if (String(booking.landlord) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    booking.status = 'rejected';
    await booking.save();
    res.json({ ok: true, booking });
  } catch (e) { next(e); }
};

exports.cancel = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ ok: false, message: 'Not found' });
    if (String(booking.tenant) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({ ok: true, booking });
  } catch (e) { next(e); }
};
