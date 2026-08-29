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

module.exports = router;
