import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  rent: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
});

const Property = mongoose.model("Property", propertySchema);

export default Property;
