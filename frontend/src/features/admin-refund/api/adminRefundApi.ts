import { axiosClient } from '../../../shared/api/axiosClient';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type { RefundQueueResponse, RefundDetailResponse, RefundDecisionRequest, RefundQueueFilters } from '../types';

export const adminRefundApi = {
  getPendingRefunds: async (page: number, size: number, filters: RefundQueueFilters = {}): Promise<PageResponse<RefundQueueResponse>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<RefundQueueResponse>>>('/v1/admin/refunds', {
      params: {
        ...filters,
        createdFrom: filters.createdFrom ? new Date(`${filters.createdFrom}T00:00:00+07:00`).toISOString() : undefined,
        createdTo: filters.createdTo ? new Date(`${filters.createdTo}T23:59:59.999+07:00`).toISOString() : undefined,
        page,
        size,
        sort: 'createdAt,desc',
      }
    });
    return response.data.data;
  },

  getRefundDetail: async (id: string): Promise<RefundDetailResponse> => {
    const response = await axiosClient.get<ApiResponse<RefundDetailResponse>>(`/v1/admin/refunds/${id}`);
    return response.data.data;
  },

  approveRefund: async (id: string, payload: RefundDecisionRequest): Promise<void> => {
    await axiosClient.post(`/v1/admin/refunds/${id}/approve`, payload);
  },

  rejectRefund: async (id: string, payload: RefundDecisionRequest): Promise<void> => {
    await axiosClient.post(`/v1/admin/refunds/${id}/reject`, payload);
  }
};
