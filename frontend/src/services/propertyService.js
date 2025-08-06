import axios from 'axios';

const API_URL = 'http://localhost:5000/api/properties';

export const getProperties = async (filters = {}) => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};
