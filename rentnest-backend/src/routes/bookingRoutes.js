const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/bookingController');
const { TENANT, LANDLORD, ADMIN } = require('../constants/roles');

router.post('/', auth, requireRole(TENANT), ctrl.create);
router.get('/me', auth, requireRole(TENANT, LANDLORD, ADMIN), ctrl.mine);
router.patch('/:id/approve', auth, requireRole(LANDLORD, ADMIN), ctrl.approve);
router.patch('/:id/reject', auth, requireRole(LANDLORD, ADMIN), ctrl.reject);
router.patch('/:id/cancel', auth, requireRole(TENANT, ADMIN), ctrl.cancel);

module.exports = router;
