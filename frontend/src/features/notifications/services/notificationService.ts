import { axiosClient } from '../../../shared/api/axiosClient';
import type { NotificationResponse, NotificationQueryParams, PageResponse } from '../types';
import type { ApiResponse } from '../../../shared/types/api';

const BASE_URL = '/v1/notifications';

// TODO: [UC-21 Tech Debt] Replace mock Bearer token with real OAuth2/JWT token
// from authentication system (e.g., Keycloak, Firebase Auth) before production.
// Current implementation sends user UUID as Bearer token for local development only.
// This works because backend SecurityConfig has a mock JwtDecoder gated by
// @ConditionalOnProperty("manabihub.security.mock-jwt").
const getTempUserId = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.includes('/student')) {
      return 'd0000000-0000-0000-0000-000000000001'; // Demo Student
    } else if (window.location.pathname.includes('/admin')) {
      return 'c0000000-0000-0000-0000-000000000001'; // SysAdmin
    }
  }
  return 'd0000000-0000-0000-0000-000000000002'; // Demo Teacher
};

const authHeaders = () => ({
  'Authorization': `Bearer ${getTempUserId()}`,
});

export const notificationService = {
  async fetchNotifications(params?: NotificationQueryParams): Promise<PageResponse<NotificationResponse>> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.isRead !== undefined) queryParams.isRead = params.isRead;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;

    const { data } = await axiosClient.get<ApiResponse<PageResponse<NotificationResponse>>>(BASE_URL, {
      params: queryParams,
      headers: authHeaders(),
    });
    return data.data;
  },

  async fetchUnreadCount(): Promise<number> {
    const { data } = await axiosClient.get<ApiResponse<{ unreadCount: number }>>(`${BASE_URL}/unread-count`, {
      headers: authHeaders(),
    });
    return data.data.unreadCount;
  },

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const { data } = await axiosClient.patch<ApiResponse<NotificationResponse>>(
      `${BASE_URL}/${notificationId}/read`,
      null,
      { headers: authHeaders() }
    );
    return data.data;
  },

  async markAsUnread(notificationId: string): Promise<NotificationResponse> {
    const { data } = await axiosClient.patch<ApiResponse<NotificationResponse>>(
      `${BASE_URL}/${notificationId}/unread`,
      null,
      { headers: authHeaders() }
    );
    return data.data;
  },

  async markAllAsRead(): Promise<number> {
    const { data } = await axiosClient.patch<ApiResponse<{ updatedCount: number }>>(
      `${BASE_URL}/read-all`,
      null,
      { headers: authHeaders() }
    );
    return data.data.updatedCount;
  },
};
