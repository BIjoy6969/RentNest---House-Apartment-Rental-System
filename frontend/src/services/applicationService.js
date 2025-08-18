import axios from "axios";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const applyRental = async (data) => {
  const res = await axios.post(`${API}/api/applications`, data);
  return res.data;
};

export const getApplications = async (landlordId) => {
  const res = await axios.get(`${API}/api/applications?landlordId=${landlordId}`);
  return res.data;
};

export const updateApplication = async (id, status) => {
  const res = await axios.put(`${API}/api/applications/${id}`, { status });
  return res.data;
};
