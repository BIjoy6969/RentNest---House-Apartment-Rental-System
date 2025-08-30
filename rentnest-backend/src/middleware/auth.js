const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid token' });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
}

module.exports = auth;
