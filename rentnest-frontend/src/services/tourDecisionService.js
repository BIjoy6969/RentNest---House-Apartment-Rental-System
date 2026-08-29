// src/services/tourDecisionService.js
import { api } from '../api';

export const tourDecisionService = {
  // Tenant submits decision
  submitTenantDecision: async (data) => {
    const res = await api.post('/tour-decisions', data);
    return res.data;
  },

  // Tenant views own decisions
  getMine: async () => {
    const res = await api.get('/tour-decisions/mine');
    return res.data;
  },

  // Landlord views incoming decisions
  getLandlordDecisions: async () => {
    const res = await api.get('/tour-decisions/incoming');
    return res.data;
  },

  // Landlord updates feedback
  submitLandlordDecision: async (id, data) => {
    const res = await api.patch(`/tour-decisions/${id}/landlord`, data);
    return res.data;
  },

  // Get by booking ID
  getByBooking: async (bookingId) => {
    const res = await api.get(`/tour-decisions/booking/${bookingId}`);
    return res.data;
  }
};
