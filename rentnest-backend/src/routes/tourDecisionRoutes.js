// src/routes/tourDecisionRoutes.js
const express = require('express');
const router = express.Router();
const tourDecisionController = require('../controllers/tourDecisionController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Tenant submits decision
router.post('/', auth, requireRole('tenant'), tourDecisionController.submitTenantDecision);

// Tenant views own decisions
router.get('/mine', auth, requireRole('tenant'), tourDecisionController.getMine);

// Landlord views incoming decisions
router.get('/incoming', auth, requireRole('landlord', 'admin'), tourDecisionController.getLandlordDecisions);

// Landlord updates their feedback
router.patch('/:id/landlord', auth, requireRole('landlord', 'admin'), tourDecisionController.submitLandlordDecision);

// Lookup by booking ID
router.get('/booking/:bookingId', auth, tourDecisionController.getByBooking);

module.exports = router;
