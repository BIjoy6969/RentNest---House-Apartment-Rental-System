// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Tenant rental preferences
router.get('/preferences', auth, userController.getPreferences);
router.patch('/preferences', auth, userController.updatePreferences);

module.exports = router;

