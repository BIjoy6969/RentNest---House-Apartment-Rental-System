const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('./models/Property');

const sampleProperties = [
  {
    title: "Modern Apartment",
    location: "Dhaka",
    rent: 25000,
    bedrooms: 2,
    description: "Spacious and well-lit apartment in the city center.",
    image: "/images/apartment1.jpg"
  },
  {
    title: "Luxury Flat",
    location: "Chittagong",
    rent: 35000,
    bedrooms: 3,
    description: "Fully furnished luxury flat with sea view.",
    image: "/images/apartment2.jpg"
  },
  {
    title: "Cozy Studio",
    location: "Sylhet",
    rent: 15000,
    bedrooms: 1,
    description: "Compact and affordable studio for single tenants.",
    image: "/images/studio.jpg"
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await Property.deleteMany(); // Clear existing data
    await Property.insertMany(sampleProperties);
    console.log('Sample data inserted');
    mongoose.connection.close();
  })
  .catch(err => console.log(err));
