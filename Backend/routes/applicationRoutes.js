import express from "express";
import { 
  createApplication, 
  getApplicationsByProperty, 
  updateApplicationStatus, 
  getTenantApplications 
} from "../controllers/applicationController.js";

const router = express.Router();

// Tenant submits application
router.post("/", createApplication);

// Landlord views all applications for a property
router.get("/property/:propertyId", getApplicationsByProperty);

// Landlord updates application status
router.put("/:id/status", updateApplicationStatus);

// Tenant views their applications
router.get("/tenant/:tenantId", getTenantApplications);

export default router;
