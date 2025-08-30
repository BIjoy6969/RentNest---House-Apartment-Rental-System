const { ADMIN } = require('../constants/roles');

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    next();
  };
}

function isOwnerOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      const ownerId = await getResourceOwnerId(req);
      if (!ownerId) return res.status(404).json({ ok: false, message: 'Resource not found' });
      if (req.user.role === ADMIN || String(req.user._id) === String(ownerId)) return next();
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireRole, isOwnerOrAdmin };
