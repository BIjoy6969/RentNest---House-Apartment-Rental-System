import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title: String,
  location: String,
  rent: Number,
  bedrooms: Number,
  description: String,
  image: String,
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref:"User" }
});

export default mongoose.model("Property", propertySchema);
