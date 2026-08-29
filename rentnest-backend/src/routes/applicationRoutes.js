// src/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.post('/', auth, requireRole('tenant'), applicationController.submit);
router.get('/mine', auth, applicationController.mine);
router.get('/me', auth, applicationController.mine);
router.get('/:id', auth, applicationController.getOne);
router.patch('/:id/status', auth, requireRole('landlord', 'admin'), applicationController.setStatus);

// Tenant withdrawal
router.patch('/:id/withdraw', auth, requireRole('tenant'), applicationController.withdraw);

// Landlord requests clarification / info
router.patch('/:id/request-info', auth, requireRole('landlord', 'admin'), applicationController.requestInfo);

// Tenant responds to info request
router.patch('/:id/respond-info', auth, requireRole('tenant'), applicationController.respondInfo);

module.exports = router;

