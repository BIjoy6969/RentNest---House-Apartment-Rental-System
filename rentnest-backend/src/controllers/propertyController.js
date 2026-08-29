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
      city, area, minRent, maxRent, bedrooms, bathrooms,
      propertyType, status, amenities, verifiedOnly,
      bachelorAllowed, familyAllowed, studentAllowed,
      q, sort = 'newest',
      page = 1, limit = 20
    } = req.query;

    const filter = { isActive: true, isFlagged: { $ne: true } };

    if (city && city.trim()) {
      filter.city = new RegExp(escapeRegex(city.trim()), 'i');
    }

    if (area && area.trim()) {
      filter['location.area'] = new RegExp(escapeRegex(area.trim()), 'i');
    }

    if (propertyType && propertyType.trim()) {
      filter.propertyType = propertyType.trim().toLowerCase();
    }

    if (status && status.trim()) {
      filter.status = status.trim().toLowerCase();
    } else {
      // Default show available
      filter.status = { $in: ['available', 'reserved'] };
    }

    if (verifiedOnly === 'true' || verifiedOnly === true) {
      filter.verificationStatus = 'approved';
    }

    if (bachelorAllowed === 'true' || bachelorAllowed === true) {
      filter['rules.bachelorAllowed'] = true;
    }
    if (familyAllowed === 'true' || familyAllowed === true) {
      filter['rules.familyAllowed'] = true;
    }
    if (studentAllowed === 'true' || studentAllowed === true) {
      filter['rules.studentAllowed'] = true;
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
        { 'location.area': re },
        { state: re },
        { country: re }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { rent: 1 };
    else if (sort === 'price_desc') sortOption = { rent: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'bedrooms') sortOption = { bedrooms: -1 };
    else if (sort === 'score') sortOption = { completenessScore: -1 };
    else if (sort === 'views') sortOption = { viewCount: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, properties] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .populate('owner', 'name email role verificationStatus trustScore phone avatar')
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
 * Public property details with incremented view count.
 */
exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    // Increment viewCount non-blockingly
    const prop = await Property.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('owner', 'name email role verificationStatus trustScore phone avatar');

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
    const properties = await Property.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate('owner', 'name email role verificationStatus trustScore');
    res.json(properties);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/properties/create
 * Landlord: create a new property listing with multiple photos, costs breakdown, rules & location.
 */
exports.create = async (req, res, next) => {
  try {
    const {
      title, description, address, city, state, country,
      rent, bedrooms, bathrooms, amenities, propertyType,
      area, lat, lng,
      serviceCharge, parkingCost, internetCost, waterCost, gasCost, electricityEstimate,
      advanceMonths, securityDeposit,
      familyAllowed, bachelorAllowed, studentAllowed, petsAllowed, smokingAllowed,
      minLeaseDurationMonths, preferredMoveInDate
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
      try {
        const jsonParsed = JSON.parse(amenities);
        if (Array.isArray(jsonParsed)) parsedAmenities = jsonParsed;
        else parsedAmenities = amenities.split(',').map(s => s.trim()).filter(Boolean);
      } catch {
        parsedAmenities = amenities.split(',').map(s => s.trim()).filter(Boolean);
      }
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

    const defaultFallback = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop';
    const primaryImgUrl = uploadedImages.length > 0 ? uploadedImages[0].url : defaultFallback;

    const parsedRent = Number(rent);

    const newPropData = {
      owner: req.user._id,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      state: (state || '').trim(),
      country: (country || 'Bangladesh').trim(),
      rent: parsedRent,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      amenities: parsedAmenities,
      propertyType: propertyType || 'apartment',
      images: uploadedImages,
      imageUrl: primaryImgUrl,
      status: 'available',
      verificationStatus: 'approved', // Auto-approved on creation
      isActive: true,
      isFlagged: false,

      // Structured Bangladesh Costs
      costs: {
        serviceCharge: Number(serviceCharge) || 0,
        parking: Number(parkingCost) || 0,
        internet: Number(internetCost) || 0,
        water: Number(waterCost) || 0,
        gas: Number(gasCost) || 0,
        electricityEstimate: Number(electricityEstimate) || 0,
        advanceMonths: Number(advanceMonths) || 1,
        securityDeposit: Number(securityDeposit) || 0
      },

      // Rules & Preferences
      rules: {
        familyAllowed: familyAllowed !== undefined ? (familyAllowed === 'true' || familyAllowed === true) : true,
        bachelorAllowed: bachelorAllowed !== undefined ? (bachelorAllowed === 'true' || bachelorAllowed === true) : true,
        studentAllowed: studentAllowed !== undefined ? (studentAllowed === 'true' || studentAllowed === true) : true,
        petsAllowed: petsAllowed === 'true' || petsAllowed === true,
        smokingAllowed: smokingAllowed === 'true' || smokingAllowed === true,
        minLeaseDurationMonths: Number(minLeaseDurationMonths) || 6,
        preferredMoveInDate: preferredMoveInDate ? new Date(preferredMoveInDate) : undefined
      },

      // Structured location
      location: {
        area: (area || '').trim(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null
      },

      // Price audit history
      priceHistory: [
        {
          rent: parsedRent,
          changedAt: new Date(),
          changedBy: req.user._id
        }
      ]
    };

    newPropData.completenessScore = calculateCompleteness(newPropData);

    const prop = await Property.create(newPropData);
    const populated = await Property.findById(prop._id).populate('owner', 'name email role verificationStatus trustScore');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/properties/:id
 * Landlord / Admin: update property details, track price history & append/modify photos.
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

    const oldRent = prop.rent;

    const allowedFields = [
      'title', 'description', 'address', 'city', 'state', 'country',
      'rent', 'bedrooms', 'bathrooms', 'amenities', 'propertyType', 'status', 'isActive',
      'verificationStatus'
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (key === 'amenities') {
          if (Array.isArray(req.body.amenities)) {
            prop.amenities = req.body.amenities.map(s => String(s).trim()).filter(Boolean);
          } else {
            try {
              const jsonParsed = JSON.parse(req.body.amenities);
              if (Array.isArray(jsonParsed)) prop.amenities = jsonParsed;
              else prop.amenities = String(req.body.amenities).split(',').map(s => s.trim()).filter(Boolean);
            } catch {
              prop.amenities = String(req.body.amenities).split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        } else if (['rent', 'bedrooms', 'bathrooms'].includes(key)) {
          const val = Number(req.body[key]);
          if (val >= 0) prop[key] = val;
        } else {
          prop[key] = req.body[key];
        }
      }
    }

    // Update costs object if provided
    if (!prop.costs) prop.costs = {};
    if (req.body.serviceCharge !== undefined) prop.costs.serviceCharge = Number(req.body.serviceCharge);
    if (req.body.parkingCost !== undefined) prop.costs.parking = Number(req.body.parkingCost);
    if (req.body.internetCost !== undefined) prop.costs.internet = Number(req.body.internetCost);
    if (req.body.waterCost !== undefined) prop.costs.water = Number(req.body.waterCost);
    if (req.body.gasCost !== undefined) prop.costs.gas = Number(req.body.gasCost);
    if (req.body.electricityEstimate !== undefined) prop.costs.electricityEstimate = Number(req.body.electricityEstimate);
    if (req.body.advanceMonths !== undefined) prop.costs.advanceMonths = Number(req.body.advanceMonths);
    if (req.body.securityDeposit !== undefined) prop.costs.securityDeposit = Number(req.body.securityDeposit);

    // Update rules object if provided
    if (!prop.rules) prop.rules = {};
    if (req.body.familyAllowed !== undefined) prop.rules.familyAllowed = req.body.familyAllowed === 'true' || req.body.familyAllowed === true;
    if (req.body.bachelorAllowed !== undefined) prop.rules.bachelorAllowed = req.body.bachelorAllowed === 'true' || req.body.bachelorAllowed === true;
    if (req.body.studentAllowed !== undefined) prop.rules.studentAllowed = req.body.studentAllowed === 'true' || req.body.studentAllowed === true;
    if (req.body.petsAllowed !== undefined) prop.rules.petsAllowed = req.body.petsAllowed === 'true' || req.body.petsAllowed === true;
    if (req.body.smokingAllowed !== undefined) prop.rules.smokingAllowed = req.body.smokingAllowed === 'true' || req.body.smokingAllowed === true;
    if (req.body.minLeaseDurationMonths !== undefined) prop.rules.minLeaseDurationMonths = Number(req.body.minLeaseDurationMonths);
    if (req.body.preferredMoveInDate !== undefined) prop.rules.preferredMoveInDate = req.body.preferredMoveInDate ? new Date(req.body.preferredMoveInDate) : null;

    // Update location
    if (!prop.location) prop.location = {};
    if (req.body.area !== undefined) prop.location.area = String(req.body.area).trim();
    if (req.body.lat !== undefined) prop.location.lat = req.body.lat ? Number(req.body.lat) : null;
    if (req.body.lng !== undefined) prop.location.lng = req.body.lng ? Number(req.body.lng) : null;

    // Track price change in priceHistory
    if (req.body.rent !== undefined && Number(req.body.rent) !== oldRent) {
      const newRent = Number(req.body.rent);
      prop.priceHistory.push({
        rent: newRent,
        changedAt: new Date(),
        changedBy: req.user._id
      });
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

    const updated = await Property.findById(prop._id).populate('owner', 'name email role verificationStatus trustScore');
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
