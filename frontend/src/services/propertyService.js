import axios from "axios";

// Point this to your backend
const API_URL = "http://localhost:5000/api/properties";

// ✅ Fetch all properties
export const fetchProperties = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};

// ✅ Fetch single property by ID
export const fetchPropertyById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching property by ID:", error);
    throw error;
  }
};

// ✅ Create new property
export const createProperty = async (propertyData) => {
  try {
    const res = await axios.post(API_URL, propertyData);
    return res.data;
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
};

// ✅ Update property
export const updateProperty = async (id, propertyData) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, propertyData);
    return res.data;
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
};

// ✅ Delete property
export const deleteProperty = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
};
