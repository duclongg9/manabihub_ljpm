export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationQueryParams {
  type?: string;
  isRead?: boolean;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Notification type config for UI display
export interface NotificationTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  PAYMENT: {
    label: 'Thanh toán',
    color: '#E65100',
    bgColor: '#FFF3E0',
    icon: '💳',
  },
  AI_FEEDBACK: {
    label: 'AI Feedback',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    icon: '✨',
  },
  REFUND: {
    label: 'Hoàn tiền',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    icon: '↩',
  },
  COURSE: {
    label: 'Khóa học',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
    icon: '📚',
  },
  SYSTEM: {
    label: 'Hệ thống',
    color: '#455A64',
    bgColor: '#ECEFF1',
    icon: '⚙',
  },
};

export const NOTIFICATION_TYPE_KEYS = ['PAYMENT', 'AI_FEEDBACK', 'REFUND', 'COURSE', 'SYSTEM'] as const;

export type ReadFilter = 'ALL' | 'UNREAD' | 'READ';
