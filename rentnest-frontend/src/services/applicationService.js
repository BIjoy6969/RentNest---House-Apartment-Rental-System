// src/services/applicationService.js
import { api } from '../api';

export const applicationService = {
  submit: async (data) => {
    const res = await api.post('/applications', data);
    return res.data;
  },

  getMine: async () => {
    const res = await api.get('/applications/mine');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },

  updateStatus: async (id, status, updatePropertyStatus = false) => {
    const res = await api.patch(`/applications/${id}/status`, { status, updatePropertyStatus });
    return res.data;
  }
};
