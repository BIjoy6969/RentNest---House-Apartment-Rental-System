const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.post('/favorites', auth, ctrl.addFavorite);
router.delete('/favorites', auth, ctrl.removeFavorite);
router.get('/favorites', auth, ctrl.myFavorites);

module.exports = router;
