// src/controllers/propertyController.js
const Property = require('../models/Property');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { calculateCompleteness } = require('../services/scoreService');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Helper to delete a file from the uploads directory if it's a local upload
 */
function safelyDeleteLocalFile(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const filename = path.basename(fileUrl);
  const filePath = path.join(__dirname, '../uploads', filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to unlink file:', filePath, e.message);
    }
  }
}

/**
 * GET /api/properties
 * Public listings with filtering, search, pagination, and sorting.
 */
exports.list = async (req, res, next) => {
  try {
    const {
      city, minRent, maxRent, bedrooms, bathrooms,
      propertyType, status, amenities, q, sort = 'newest',
      page = 1, limit = 20
    } = req.query;

    const filter = { isActive: true, isFlagged: { $ne: true } };

    if (city && city.trim()) {
      filter.city = new RegExp(escapeRegex(city.trim()), 'i');
    }

    if (propertyType && propertyType.trim()) {
      filter.propertyType = propertyType.trim().toLowerCase();
    }

    if (status && status.trim()) {
      filter.status = status.trim().toLowerCase();
    }

    if (bedrooms !== undefined && bedrooms !== '') {
      const b = Number(bedrooms);
      if (!isNaN(b) && b > 0) filter.bedrooms = { $gte: b };
    }

    if (bathrooms !== undefined && bathrooms !== '') {
      const bath = Number(bathrooms);
      if (!isNaN(bath) && bath > 0) filter.bathrooms = { $gte: bath };
    }

    if (minRent !== undefined || maxRent !== undefined) {
      filter.rent = {};
      if (minRent !== undefined && minRent !== '') {
        const min = Number(minRent);
        if (!isNaN(min) && min >= 0) filter.rent.$gte = min;
      }
      if (maxRent !== undefined && maxRent !== '') {
        const max = Number(maxRent);
        if (!isNaN(max) && max >= 0) filter.rent.$lte = max;
      }
      if (Object.keys(filter.rent).length === 0) delete filter.rent;
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : String(amenities).split(',').map(s => s.trim()).filter(Boolean);
      if (amenitiesList.length > 0) {
        filter.amenities = { $all: amenitiesList };
      }
    }

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const re = new RegExp(escaped, 'i');
      filter.$or = [
        { title: re },
        { description: re },
        { address: re },
        { city: re },
        { state: re },
        { country: re }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { rent: 1 };
    else if (sort === 'price_desc') sortOption = { rent: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'bedrooms') sortOption = { bedrooms: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, properties] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .populate('owner', 'name email role')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
    ]);

    res.json({
      properties,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/properties/:id
 * Public property details.
 */
exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const prop = await Property.findById(id).populate('owner', 'name email role');
    if (!prop || !prop.isActive || prop.isFlagged) {
      return res.status(404).json({ message: 'Property not found or unavailable' });
    }

    res.json(prop);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/properties/mine/list
 * Landlord: list own properties.
 */
exports.myProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/properties/create
 * Landlord: create a new property listing with multiple photos.
 */
exports.create = async (req, res, next) => {
  try {
    const {
      title, description, address, city, state, country,
      rent, bedrooms, bathrooms, amenities, propertyType
    } = req.body;

    if (!title || !description || !address || !city ||
        rent === undefined || bedrooms === undefined || bathrooms === undefined) {
      return res.status(400).json({ message: 'All required property fields must be provided' });
    }

    if (Number(rent) < 0 || Number(bedrooms) < 0 || Number(bathrooms) < 0) {
      return res.status(400).json({ message: 'Rent, bedrooms, and bathrooms cannot be negative' });
    }

    let parsedAmenities = [];
    if (Array.isArray(amenities)) {
      parsedAmenities = amenities.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof amenities === 'string' && amenities.trim()) {
      parsedAmenities = amenities.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Collect uploaded files
    const uploadedImages = [];
    const files = req.files || {};
    const imageFiles = [
      ...(files.images || []),
      ...(files.image || [])
    ];

    if (imageFiles.length > 0) {
      imageFiles.forEach((file, index) => {
        uploadedImages.push({
          url: `/uploads/${file.filename}`,
          isPrimary: index === 0,
          order: index,
          caption: file.originalname || ''
        });
      });
    } else if (req.body.imageUrl) {
      uploadedImages.push({
        url: req.body.imageUrl,
        isPrimary: true,
        order: 0,
        caption: 'Primary photo'
      });
    }

    const defaultFallback = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop';
    const primaryImgUrl = uploadedImages.length > 0 ? uploadedImages[0].url : defaultFallback;

    const newPropData = {
      owner: req.user._id,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      state: (state || '').trim(),
      country: (country || 'Bangladesh').trim(),
      rent: Number(rent),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      amenities: parsedAmenities,
      propertyType: propertyType || 'apartment',
      images: uploadedImages,
      imageUrl: primaryImgUrl,
      status: 'available',
      isActive: true,
      isFlagged: false
    };

    newPropData.completenessScore = calculateCompleteness(newPropData);

    const prop = await Property.create(newPropData);
    const populated = await Property.findById(prop._id).populate('owner', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/properties/:id
 * Landlord / Admin: update property details & append/modify photos.
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const prop = await Property.findById(id);
    if (!prop) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const isOwner = String(prop.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you do not own this property' });
    }

    const allowedFields = [
      'title', 'description', 'address', 'city', 'state', 'country',
      'rent', 'bedrooms', 'bathrooms', 'amenities', 'propertyType', 'status', 'isActive'
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (key === 'amenities') {
          prop.amenities = Array.isArray(req.body.amenities)
            ? req.body.amenities.map(s => String(s).trim()).filter(Boolean)
            : String(req.body.amenities).split(',').map(s => s.trim()).filter(Boolean);
        } else if (['rent', 'bedrooms', 'bathrooms'].includes(key)) {
          const val = Number(req.body[key]);
          if (val >= 0) prop[key] = val;
        } else {
          prop[key] = req.body[key];
        }
      }
    }

    // Append newly uploaded files if any
    const files = req.files || {};
    const newImageFiles = [
      ...(files.images || []),
      ...(files.image || [])
    ];

    if (newImageFiles.length > 0) {
      const currentCount = prop.images ? prop.images.length : 0;
      newImageFiles.forEach((file, index) => {
        prop.images.push({
          url: `/uploads/${file.filename}`,
          isPrimary: currentCount === 0 && index === 0,
          order: currentCount + index,
          caption: file.originalname || ''
        });
      });
    }

    // Ensure at least one image is primary if images exist
    if (prop.images && prop.images.length > 0) {
      const hasPrimary = prop.images.some(img => img.isPrimary);
      if (!hasPrimary) {
        prop.images[0].isPrimary = true;
      }
      const primary = prop.images.find(img => img.isPrimary);
      prop.imageUrl = primary ? primary.url : prop.images[0].url;
    }

    prop.completenessScore = calculateCompleteness(prop);
    await prop.save();

    const updated = await Property.findById(prop._id).populate('owner', 'name email role');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/properties/:id/images/:imageId
 * Delete a specific image from property and unlinks file from disk.
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const prop = await Property.findById(id);
    if (!prop) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const isOwner = String(prop.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you do not own this property' });
    }

    const targetImg = prop.images.id(imageId) || prop.images.find(img => String(img._id) === String(imageId));
    if (!targetImg) {
      return res.status(404).json({ message: 'Image not found on this property' });
    }

    safelyDeleteLocalFile(targetImg.url);

    // Pull image subdocument
    prop.images.pull(targetImg._id);

    // If deleted was primary, set first remaining image as primary
    if (prop.images.length > 0) {
      const hasPrimary = prop.images.some(img => img.isPrimary);
      if (!hasPrimary) {
        prop.images[0].isPrimary = true;
      }
      const primary = prop.images.find(img => img.isPrimary);
      prop.imageUrl = primary ? primary.url : prop.images[0].url;
    } else {
      prop.imageUrl = '';
    }

    prop.completenessScore = calculateCompleteness(prop);
    await prop.save();

    const updated = await Property.findById(prop._id).populate('owner', 'name email role');
    res.json({ message: 'Image deleted successfully', property: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/properties/:id/primary-image
 * Set an image as primary for the property.
 */
exports.setPrimaryImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const prop = await Property.findById(id);
    if (!prop) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const isOwner = String(prop.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you do not own this property' });
    }

    let found = false;
    prop.images.forEach(img => {
      if (String(img._id) === String(imageId)) {
        img.isPrimary = true;
        prop.imageUrl = img.url;
        found = true;
      } else {
        img.isPrimary = false;
      }
    });

    if (!found) {
      return res.status(404).json({ message: 'Image ID not found on this property' });
    }

    await prop.save();
    const updated = await Property.findById(prop._id).populate('owner', 'name email role');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/properties/:id
 * Landlord / Admin: delete property and unlink all uploaded image files.
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const prop = await Property.findById(id);
    if (!prop) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const isOwner = String(prop.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you do not own this property' });
    }

    // Safely delete all image files
    if (prop.images && prop.images.length > 0) {
      prop.images.forEach(img => safelyDeleteLocalFile(img.url));
    }
    safelyDeleteLocalFile(prop.imageUrl);

    await prop.deleteOne();
    res.json({ ok: true, message: 'Property successfully deleted' });
  } catch (err) {
    next(err);
  }
};
