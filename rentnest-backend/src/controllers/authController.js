const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ALLOWED_PUBLIC_ROLES = ['tenant', 'landlord'];

function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'superlongrandomsecretstring',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    favorites: user.favorites || []
  };
}

/**
 * POST /api/auth/register
 * Public registration for tenants and landlords only.
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'tenant' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!ALLOWED_PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({
        message: 'Public registration only permits tenant or landlord accounts'
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * User login with email and password.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Current authenticated user profile.
 */
exports.me = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    next(err);
  }
};
