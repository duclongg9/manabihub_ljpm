import type { PageResponse } from '../../../shared/types/api';
import { axiosClient as api } from '../../../shared/api/axiosClient';

export interface AuditLogDto {
  id: string;
  actorType: string;
  actorUserId?: string;
  actorAdminId?: string;
  actorDisplayName?: string;
  actorEmail?: string;
  actorRoleCode?: string;
  action: string;
  targetType: string;
  targetId?: string;
  createdAt: string;
}

export interface AuditLogDetailDto extends AuditLogDto {
  beforeValue?: Record<string, any>;
  afterValue?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilterParams {
  actor?: string;
  role?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export const adminAuditApi = {
  getAuditLogs: async (params: AuditLogFilterParams): Promise<PageResponse<AuditLogDto>> => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data.data;
  },

  getAuditLogDetail: async (id: string): Promise<AuditLogDetailDto> => {
    const response = await api.get(`/admin/audit-logs/${id}`);
    return response.data.data;
  },
};
