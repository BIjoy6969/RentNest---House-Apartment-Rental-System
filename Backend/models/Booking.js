import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref:"User" },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref:"Property" },
  status: { type:String, enum:["pending","approved","rejected"], default:"pending" },
  createdAt: { type:Date, default: Date.now }
});

export default mongoose.model("Booking", bookingSchema);
