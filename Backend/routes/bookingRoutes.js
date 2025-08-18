import express from "express";
import { createBooking, updateBooking, getTenantBookings } from "../controllers/bookingController.js";
const router = express.Router();

router.post("/", createBooking);
router.put("/:id", updateBooking);
router.get("/tenant/:tenantId", getTenantBookings);

export default router;
