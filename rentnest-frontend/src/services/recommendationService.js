// src/services/recommendationService.js
import { api } from '../api';

export const recommendationService = {
  getRecommendations: async () => {
    const res = await api.get('/recommendations');
    return res.data;
  },

  getPreferences: async () => {
    const res = await api.get('/users/preferences');
    return res.data;
  },

  updatePreferences: async (prefs) => {
    const res = await api.patch('/users/preferences', prefs);
    return res.data;
  }
};
