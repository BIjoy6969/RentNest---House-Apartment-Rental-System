// src/api.js
import axios from 'axios';

// In production on Vercel/cloud, use relative '/api' unless explicitly overridden by REACT_APP_API_URL
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // using JWT, not cookies
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Token expired or invalid → log out
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // redirect to login
    }
    return Promise.reject(err);
  }
);
