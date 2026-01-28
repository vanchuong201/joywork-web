export type NotificationType =
  | "TICKET_MESSAGE"
  | "TICKET_CREATED"
  | "APPLICATION_STATUS"
  | "JOB_APPLICATION"
  | "COMPANY_FOLLOW"
  | "POST_LIKE"
  | "POST_COMMENT"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}
