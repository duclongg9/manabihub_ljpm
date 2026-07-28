import { axiosClient } from '../../../shared/api/axiosClient';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type { ResolveViolationRequest, ViolationDetailResponse, ViolationQueueItemResponse } from '../types/violation.types';

export const adminViolationService = {
  getViolationQueue: async (params?: { page?: number; size?: number; status?: string }) => {
    const response = await axiosClient.get<ApiResponse<PageResponse<ViolationQueueItemResponse>>>(
      '/api/v1/admin/violations',
      { params }
    );
    return response.data.data;
  },

  getViolationDetail: async (id: string) => {
    const response = await axiosClient.get<ApiResponse<ViolationDetailResponse>>(`/api/v1/admin/violations/${id}`);
    return response.data.data;
  },

  resolveViolation: async (id: string, data: ResolveViolationRequest) => {
    const response = await axiosClient.post<ApiResponse<ViolationDetailResponse>>(
      `/api/v1/admin/violations/${id}/resolve`,
      data
    );
    return response.data.data;
  },
};
