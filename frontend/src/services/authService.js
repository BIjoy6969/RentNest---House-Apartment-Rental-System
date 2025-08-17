import axios from 'axios';
const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export const registerUser = async (data) => {
  const res = await axios.post(`${API}/api/auth/register`, data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await axios.post(`${API}/api/auth/login`, data);
  return res.data;
};
