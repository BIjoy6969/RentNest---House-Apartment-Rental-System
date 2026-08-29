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

  updateStatus: async (id, status, rejectionCategory = null, explanation = '', updatePropertyStatus = false) => {
    const res = await api.patch(`/applications/${id}/status`, {
      status,
      rejectionCategory,
      explanation,
      updatePropertyStatus
    });
    return res.data;
  },

  withdraw: async (id, reason = '') => {
    const res = await api.patch(`/applications/${id}/withdraw`, { reason });
    return res.data;
  },

  requestInfo: async (id, message) => {
    const res = await api.patch(`/applications/${id}/request-info`, { message });
    return res.data;
  },

  respondInfo: async (id, response) => {
    const res = await api.patch(`/applications/${id}/respond-info`, { response });
    return res.data;
  }
};

