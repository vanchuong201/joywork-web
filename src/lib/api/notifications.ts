import api from "@/lib/api";
import type { Notification, NotificationListResponse, UnreadCountResponse } from "@/types/notification";

export const notificationsApi = {
  /**
   * Get notifications with pagination
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationListResponse> => {
    const { data } = await api.get<{ success: boolean; data: NotificationListResponse }>(
      "/api/notifications",
      { params }
    );
    return data.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<{ success: boolean; data: UnreadCountResponse }>(
      "/api/notifications/unread-count"
    );
    return data.data.count;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.patch("/api/notifications/read-all");
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};
