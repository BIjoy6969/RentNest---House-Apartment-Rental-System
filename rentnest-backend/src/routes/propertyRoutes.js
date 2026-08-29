// src/routes/propertyRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPEG, PNG, WEBP) are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB max per file, up to 10 files
  fileFilter
});

// Middleware for handling optional multiple or single image uploads
const multiUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 1 }
]);

// Public routes
router.get('/', propertyController.list);
router.get('/mine/list', auth, requireRole('landlord', 'admin'), propertyController.myProperties);
router.get('/:id', propertyController.getOne);

// Landlord/Admin property mutations
router.post('/create', auth, requireRole('landlord', 'admin'), multiUpload, propertyController.create);
router.put('/:id', auth, requireRole('landlord', 'admin'), multiUpload, propertyController.update);
router.delete('/:id', auth, requireRole('landlord', 'admin'), propertyController.remove);

// Image management sub-endpoints
router.delete('/:id/images/:imageId', auth, requireRole('landlord', 'admin'), propertyController.deleteImage);
router.patch('/:id/primary-image', auth, requireRole('landlord', 'admin'), propertyController.setPrimaryImage);

module.exports = router;
