// src/routes/complaintRoutes.js
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const auth = require('../middleware/auth');

router.post('/', auth, complaintController.create);
router.get('/mine', auth, complaintController.mine);

module.exports = router;
