export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  actionUrl?: string;
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
    label: 'Thanh toÃ¡n',
    color: '#E65100',
    bgColor: '#FFF3E0',
    icon: 'ðŸ’³',
  },
  AI_FEEDBACK: {
    label: 'AI Feedback',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    icon: 'âœ¨',
  },
  REFUND: {
    label: 'HoÃ n tiá»n',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    icon: 'â†©',
  },
  COURSE: {
    label: 'KhÃ³a há»c',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
    icon: 'ðŸ“š',
  },
  SYSTEM: {
    label: 'Há»‡ thá»‘ng',
    color: '#455A64',
    bgColor: '#ECEFF1',
    icon: 'âš™',
  },
};

export const NOTIFICATION_TYPE_KEYS = ['PAYMENT', 'AI_FEEDBACK', 'REFUND', 'COURSE', 'SYSTEM'] as const;

export type ReadFilter = 'ALL' | 'UNREAD' | 'READ';
