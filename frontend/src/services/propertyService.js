import axios from "axios";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const fetchProperties = async () => {
  const res = await axios.get(`${API}/api/properties`);
  return res.data;
};

export const fetchPropertyById = async (id) => {
  const res = await axios.get(`${API}/api/properties/${id}`);
  return res.data;
};

export const createProperty = async (data) => {
  const res = await axios.post(`${API}/api/properties`, data);
  return res.data;
};

export const updateProperty = async (id, data) => {
  const res = await axios.put(`${API}/api/properties/${id}`, data);
  return res.data;
};

export const deleteProperty = async (id) => {
  const res = await axios.delete(`${API}/api/properties/${id}`);
  return res.data;
};
