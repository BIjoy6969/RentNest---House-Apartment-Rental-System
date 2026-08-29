// src/routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// Tenant recommendations
router.get('/', auth, recommendationController.getRecommendations);

module.exports = router;
