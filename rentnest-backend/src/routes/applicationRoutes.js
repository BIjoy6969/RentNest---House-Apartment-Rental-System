const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/applicationController');
const { TENANT, LANDLORD, ADMIN } = require('../constants/roles');

router.post('/', auth, requireRole(TENANT), ctrl.submit);
router.get('/me', auth, requireRole(TENANT, LANDLORD, ADMIN), ctrl.mine);
router.get('/:id', auth, requireRole(TENANT, LANDLORD, ADMIN), ctrl.getOne);
router.patch('/:id/status', auth, requireRole(LANDLORD, ADMIN), ctrl.setStatus);

module.exports = router;
