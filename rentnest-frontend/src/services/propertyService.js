// src/services/propertyService.js
import { api } from '../api';

export const propertyService = {
  // List with filtering, pagination, and sorting
  list: async (params = {}) => {
    const res = await api.get('/properties', { params });
    // Support both old array responses and new paginated { properties, total, page, totalPages } format
    if (Array.isArray(res.data)) {
      return { properties: res.data, total: res.data.length, page: 1, totalPages: 1 };
    }
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/properties/${id}`);
    return res.data;
  },

  getMine: async () => {
    const res = await api.get('/properties/mine/list');
    return res.data;
  },

  create: async (formData) => {
    const res = await api.post('/properties/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  update: async (id, formData) => {
    const res = await api.put(`/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/properties/${id}`);
    return res.data;
  },

  deleteImage: async (propertyId, imageId) => {
    const res = await api.delete(`/properties/${propertyId}/images/${imageId}`);
    return res.data;
  },

  setPrimaryImage: async (propertyId, imageId) => {
    const res = await api.patch(`/properties/${propertyId}/primary-image`, { imageId });
    return res.data;
  }
};
