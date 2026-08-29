// src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.post('/', auth, messageController.sendMessage);
router.get('/inbox', auth, messageController.inbox);
router.get('/thread', auth, messageController.thread);
router.patch('/:id/read', auth, messageController.markRead);

module.exports = router;
