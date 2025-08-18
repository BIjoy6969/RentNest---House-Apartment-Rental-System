import Application from "../models/Application.js";

// Tenant submits rental application
export const createApplication = async (req, res) => {
  try {
    const { propertyId, tenantId, tenantName, tenantEmail, tenantPhone, message } = req.body;
    const newApp = new Application({ propertyId, tenantId, tenantName, tenantEmail, tenantPhone, message });
    await newApp.save();
    res.status(201).json(newApp);
  } catch (err) {
    res.status(500).json({ message: "Error creating application", error: err.message });
  }
};

// Landlord gets all applications for a property
export const getApplicationsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const applications = await Application.find({ propertyId }).populate("tenantId", "name email");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applications", error: err.message });
  }
};

// Landlord updates application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(id, { status }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
};

// Tenant sees their applications
export const getTenantApplications = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const applications = await Application.find({ tenantId }).populate("propertyId", "title location rent");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tenant applications", error: err.message });
  }
};
