import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./models/PropertyModel.js";

dotenv.config();

const sampleProperties = [
  { title: "Modern Apartment", location: "Dhaka", rent: 25000, bedrooms: 2, description: "City center apartment", image: "/images/apartment1.jpg", landlordId: "64e4fa1234567890abcdef01" },
  { title: "Luxury Flat", location: "Chittagong", rent: 35000, bedrooms: 3, description: "Furnished flat with sea view", image: "/images/apartment2.jpg", landlordId: "64e4fa1234567890abcdef01" },
  { title: "Cozy Studio", location: "Sylhet", rent: 15000, bedrooms: 1, description: "Compact studio", image: "/images/studio.jpg", landlordId: "64e4fa1234567890abcdef02" },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await Property.deleteMany();
    await Property.insertMany(sampleProperties);
    console.log('Sample properties inserted');
    mongoose.connection.close();
  })
  .catch(err => console.error(err));
