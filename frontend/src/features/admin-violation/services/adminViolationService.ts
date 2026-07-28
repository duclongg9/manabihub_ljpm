import { axiosClient } from '../../../shared/api/axiosClient';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type { ResolveViolationRequest, ViolationDetailResponse, ViolationQueueItemResponse } from '../types/violation.types';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export const adminViolationService = {
  getViolationQueue: async (params?: { page?: number; size?: number; status?: string }) => {
    const response = await axiosClient.get<ApiResponse<PageResponse<ViolationQueueItemResponse>>>(
      ENDPOINTS.ADMIN_VIOLATIONS.QUEUE,
      { params }
    );
    return response.data.data;
  },

  getViolationDetail: async (id: string) => {
    const response = await axiosClient.get<ApiResponse<ViolationDetailResponse>>(
      ENDPOINTS.ADMIN_VIOLATIONS.DETAIL(id)
    );
    return response.data.data;
  },

  resolveViolation: async (id: string, data: ResolveViolationRequest) => {
    const response = await axiosClient.post<ApiResponse<ViolationDetailResponse>>(
      ENDPOINTS.ADMIN_VIOLATIONS.RESOLVE(id),
      data
    );
    return response.data.data;
  },
};
