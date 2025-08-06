const express = require('express');
const router = express.Router();
const { getProperties } = require('../controllers/propertyController');

router.get('/', getProperties);

module.exports = router;
