// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(auth, requireRole('admin'));

// Stats
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.listUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Properties
router.get('/properties', adminController.listProperties);
router.patch('/properties/:id/flag', adminController.flagProperty);
router.patch('/properties/:id/unflag', adminController.unflagProperty);
router.patch('/properties/:id/verify', adminController.verifyProperty);
router.delete('/properties/:id', adminController.deleteProperty);

// User Moderation & Verification
router.patch('/users/:id/verify', adminController.verifyLandlord);

// Applications
router.get('/applications', adminController.listApplications);

// Complaints
router.get('/complaints', adminController.listComplaints);
router.patch('/complaints/:id/status', adminController.setComplaintStatus);

module.exports = router;

