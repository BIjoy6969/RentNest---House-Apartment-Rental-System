// src/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const Property = require('../models/Property'); // Import Property model

// GET all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find();  // Get all properties from DB
    res.json(properties);  // Send the list of properties as response
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server Error' });  // Handle any errors
  }
});

// GET a single property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);  // Find property by ID
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });  // Handle case where property is not found
    }
    res.json(property);  // Return the property details
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server Error' });  // Handle any errors
  }
});
// Add property (for landlord)
router.post('/create', async (req, res) => {
  try {
    const { title, description, address, city, state, country, rent, bedrooms, bathrooms, amenities } = req.body;
    const newProperty = new Property({ title, description, address, city, state, country, rent, bedrooms, bathrooms, amenities });
    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property' });
  }
});

// POST a new property (for landlords to add a property)
router.post('/create', async (req, res) => {
  try {
    const { title, description, address, city, state, country, rent, bedrooms, bathrooms, amenities } = req.body;

    // Create new property instance
    const newProperty = new Property({
      title,
      description,
      address,
      city,
      state,
      country,
      rent,
      bedrooms,
      bathrooms,
      amenities
    });

    // Save property to DB
    const property = await newProperty.save();
    res.status(201).json(property);  // Respond with the created property
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error adding property' });  // Handle errors
  }
});

// Export the routes for use in other files
module.exports = router;
