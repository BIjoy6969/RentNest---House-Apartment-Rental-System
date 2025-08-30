const Application = require('../models/Application');
const Property = require('../models/Property');

function computeScore({ incomeMonthly = 0, creditScore = 600, occupants = 1 }, rent) {
  const incomeRatio = Math.min(incomeMonthly / (rent * 3), 1);
  const credit = Math.max(Math.min((creditScore - 500) / 350, 1), 0);
  const occPenalty = Math.max(0, (occupants - 2) * 0.1);
  const score = (incomeRatio * 0.6 + credit * 0.4) - occPenalty;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

exports.submit = async (req, res, next) => {
  try {
    const { propertyId, form } = req.body;
    const prop = await Property.findById(propertyId);
    if (!prop || !prop.isActive || prop.isFlagged) return res.status(404).json({ ok: false, message: 'Property not available' });

    const score = computeScore(form || {}, prop.rent);
    const application = await Application.create({
      property: prop._id,
      tenant: req.user._id,
      landlord: prop.owner,
      form,
      score,
      statusHistory: [{ status: 'pending', by: req.user._id }]
    });
    res.status(201).json({ ok: true, application });
  } catch (e) { next(e); }
};

exports.mine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'tenant'
      ? { tenant: req.user._id }
      : req.user.role === 'landlord'
      ? { landlord: req.user._id }
      : {};
    const apps = await Application.find(filter)
      .populate('property', 'title city rent')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');
    res.json({ ok: true, applications: apps });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('property', 'title city rent owner')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');
    if (!app) return res.status(404).json({ ok: false, message: 'Not found' });

    const me = String(req.user._id);
    const isParty = [app.tenant._id, app.landlord._id].map(String).includes(me);
    if (!isParty && req.user.role !== 'admin') return res.status(403).json({ ok: false, message: 'Forbidden' });

    const screening = {
      score: app.score,
      incomeVsRent: app.form?.incomeMonthly && app.property?.rent
        ? Number((app.form.incomeMonthly / app.property.rent).toFixed(2))
        : null,
      creditScore: app.form?.creditScore ?? null,
      occupants: app.form?.occupants ?? null,
      pets: app.form?.pets ?? null
    };

    res.json({ ok: true, application: app, screening });
  } catch (e) { next(e); }
};

exports.setStatus = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ ok: false, message: 'Not found' });

    const me = String(req.user._id);
    const isLandlord = String(app.landlord) === me || req.user.role === 'admin';
    if (!isLandlord) return res.status(403).json({ ok: false, message: 'Forbidden' });

    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'Invalid status' });
    }
    app.status = status;
    app.statusHistory.push({ status, by: req.user._id, changedAt: new Date() });
    await app.save();
    res.json({ ok: true, application: app });
  } catch (e) { next(e); }
};
