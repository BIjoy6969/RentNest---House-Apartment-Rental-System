// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth middleware
 * - Reads Authorization: Bearer <token>
 * - Verifies JWT with JWT_SECRET
 * - Loads the user (without password) and attaches to req.user
 *
 * Supports tokens signed as:
 *   { userId: <id>, role: <role> }   // your current authRoutes.js
 *   { id: <id>, role: <role> }       // older code paths
 */
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ ok: false, message: 'No token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // accept either payload.userId or payload.id
    const userId = payload.userId || payload.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: 'Invalid token payload' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
}

/**
 * Export in both styles so routes can do either:
 *   const auth = require('../middleware/auth')
 * or
 *   const { auth } = require('../middleware/auth')
 */
module.exports = auth;
module.exports.auth = auth;
