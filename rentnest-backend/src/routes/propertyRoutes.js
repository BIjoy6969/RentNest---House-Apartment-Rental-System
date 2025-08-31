const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Property = require('../models/Property');

// robust auth import
const authMod = require('../middleware/auth');
const auth = typeof authMod === 'function' ? authMod : authMod.auth;

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // You can change the folder as needed
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with extension
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Allow up to 10 MB files
});


// Role check middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

// Routes

// Route to get properties created by the landlord (owned by the logged-in user)
router.get('/mine/list', auth, requireRole('landlord'), async (req, res) => {
  try {
    const list = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Public list with filters
router.get('/', async (req, res) => {
  try {
    const { city, minRent, maxRent, q } = req.query;
    const query = { isActive: true, isFlagged: { $ne: true } };

    if (city) query.city = city;
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }
    if (q) {
      const re = new RegExp(String(q), 'i');
      query.$or = [
        { title: re }, { description: re }, { city: re },
        { state: re }, { country: re }, { address: re },
      ];
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Public details of a property
router.get('/:id', async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p || !p.isActive || p.isFlagged) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(p);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create property (landlord)
router.post('/create', auth, requireRole('landlord'), upload.single('image'), async (req, res) => {
  try {
    const {
      title, description, address, city, state, country,
      rent, bedrooms, bathrooms, amenities
    } = req.body;

    if (!title || !description || !address || !city || !state || !country ||
        rent === undefined || bedrooms === undefined || bathrooms === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Handle image if uploaded

    const doc = await Property.create({
      owner: req.user.id,
      title, description, address, city, state, country,
      rent, bedrooms, bathrooms,
      amenities: Array.isArray(amenities)
        ? amenities
        : (amenities ? String(amenities).split(',').map(s => s.trim()).filter(Boolean) : []),
      imageUrl
    });

    res.status(201).json(doc); // Respond with the created property
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating property' });
  }
});

// Update property (landlord)
router.put('/:id', auth, requireRole('landlord'), async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Property not found' });
    if (String(p.owner) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const allowed = [
      'title', 'description', 'address', 'city', 'state', 'country',
      'rent', 'bedrooms', 'bathrooms', 'amenities', 'imageUrl', 'isActive'
    ];

    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        if (k === 'amenities') {
          p.amenities = Array.isArray(req.body.amenities)
            ? req.body.amenities
            : String(req.body.amenities).split(',').map(s => s.trim()).filter(Boolean);
        } else {
          p[k] = req.body[k];
        }
      }
    }

    await p.save();
    res.json(p); // Respond with the updated property
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating property' });
  }
});

// Delete property (landlord)
router.delete('/:id', auth, requireRole('landlord'), async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Property not found' });
    if (String(p.owner) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    await p.deleteOne(); // Delete the property
    res.json({ ok: true }); // Respond with success message
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting property' });
  }
});

module.exports = router;
