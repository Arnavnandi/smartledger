import api from './api';
import type { AppNotification } from '../types/notification.types';

export const notificationService = {
  getAll: async (): Promise<AppNotification[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },

  getUnread: async (): Promise<AppNotification[]> => {
    const res = await api.get('/notifications/unread');
    return res.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await api.get('/notifications/unread/count');
    return res.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  }
};
