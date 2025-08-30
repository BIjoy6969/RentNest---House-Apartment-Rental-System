const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/messageController');

router.post('/', auth, ctrl.send);
router.get('/inbox', auth, ctrl.inbox);
router.get('/thread/:userId', auth, ctrl.thread);

module.exports = router;
