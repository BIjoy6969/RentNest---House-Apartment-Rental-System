const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/adminController');
const { ADMIN } = require('../constants/roles');

router.use(auth, requireRole(ADMIN));

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/role', ctrl.setUserRole);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/properties', ctrl.listProperties);
router.patch('/properties/:id/flag', ctrl.flagProperty);

router.get('/complaints', ctrl.listComplaints);
router.patch('/complaints/:id/status', ctrl.setComplaintStatus);

module.exports = router;
