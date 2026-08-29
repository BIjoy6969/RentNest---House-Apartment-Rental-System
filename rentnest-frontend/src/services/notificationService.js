// src/services/notificationService.js
import { api } from '../api';

export const notificationService = {
  list: async () => {
    const res = await api.get('/notifications');
    return res.data; // { notifications, unreadCount }
  },

  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  }
};
