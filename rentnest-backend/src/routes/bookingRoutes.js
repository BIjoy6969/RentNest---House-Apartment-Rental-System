// src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Tenant booking creation
router.post('/', auth, requireRole('tenant'), bookingController.create);

// History
router.get('/mine', auth, requireRole('tenant'), bookingController.mine);
router.get('/me', auth, requireRole('tenant'), bookingController.mine);

// Landlord incoming requests
router.get('/incoming', auth, requireRole('landlord', 'admin'), bookingController.incoming);

// Status update (landlord/admin)
router.patch('/:id/status', auth, requireRole('landlord', 'admin'), bookingController.setStatus);

// Cancellation (tenant/landlord/admin)
router.patch('/:id/cancel', auth, bookingController.cancel);

module.exports = router;
