// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * - Reads Authorization: Bearer <token>
 * - Verifies JWT with JWT_SECRET
 * - Loads user (excluding password) into req.user
 */
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const secret = process.env.JWT_SECRET || 'superlongrandomsecretstring';
    const payload = jwt.verify(token, secret);

    const userId = payload.userId || payload.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = auth;
module.exports.auth = auth;
