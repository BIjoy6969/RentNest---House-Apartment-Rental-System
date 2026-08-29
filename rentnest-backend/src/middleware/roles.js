// src/middleware/roles.js

function requireRole(...allowedRoles) {
  // Flatten in case an array was passed
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
}

module.exports = { requireRole };
module.exports.requireRole = requireRole;
