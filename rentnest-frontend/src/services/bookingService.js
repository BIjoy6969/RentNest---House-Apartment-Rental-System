// src/services/bookingService.js
import { api } from '../api';

export const bookingService = {
  create: async (data) => {
    const res = await api.post('/bookings', data);
    return res.data;
  },

  getMine: async () => {
    const res = await api.get('/bookings/mine');
    return res.data;
  },

  getIncoming: async () => {
    const res = await api.get('/bookings/incoming');
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/bookings/${id}/status`, { status });
    return res.data;
  },

  cancel: async (id) => {
    const res = await api.patch(`/bookings/${id}/cancel`);
    return res.data;
  }
};
