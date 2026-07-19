export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface AppNotification {
  id: number;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
