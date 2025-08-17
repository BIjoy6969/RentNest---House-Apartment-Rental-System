import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import propertyRoutes from "./routes/propertyRoutes.js";

dotenv.config();
const app = express();

// ✅ Middleware
app.use(cors()); // allow requests from frontend
app.use(express.json()); // parse JSON

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Routes
app.use("/api/properties", propertyRoutes);

// ✅ Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
