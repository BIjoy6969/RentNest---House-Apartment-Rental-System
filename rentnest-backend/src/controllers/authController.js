const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ALL } = require('../constants/roles');

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (role && !ALL.includes(role)) return res.status(400).json({ ok: false, message: 'Invalid role' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    const token = sign(user);
    res.status(201).json({ ok: true, token, user: { id: user._id, name, email, role: user.role } });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    const token = sign(user);
    user.password = undefined;
    res.json({ ok: true, token, user });
  } catch (e) {
    next(e);
  }
};

exports.me = async (req, res) => {
  res.json({ ok: true, user: req.user });
};
