import { axiosClient } from "../../../shared/api/axiosClient";
import type { PayoutQueueItem, PayoutDetail, RejectPayoutPayload, ConfirmManualTransferPayload } from "../types/payout.types";
import type { ApiResponse, PageResponse } from "../../../shared/types/api";

export const adminPayoutService = {
  getPayoutQueue: async (params: any) => {
    const response = await axiosClient.get<ApiResponse<PageResponse<PayoutQueueItem>>>("/admin/payouts", { params });
    return response.data.data;
  },

  getPayoutDetail: async (withdrawalRequestId: string) => {
    const response = await axiosClient.get<ApiResponse<PayoutDetail>>(`/admin/payouts/${withdrawalRequestId}`);
    return response.data.data;
  },

  approvePayout: async (withdrawalRequestId: string) => {
    const response = await axiosClient.post<ApiResponse<void>>(`/admin/payouts/${withdrawalRequestId}/approve`);
    return response.data;
  },

  rejectPayout: async (withdrawalRequestId: string, payload: RejectPayoutPayload) => {
    const response = await axiosClient.post<ApiResponse<void>>(`/admin/payouts/${withdrawalRequestId}/reject`, payload);
    return response.data;
  },

  confirmManualTransfer: async (withdrawalRequestId: string, payload: ConfirmManualTransferPayload) => {
    const response = await axiosClient.post<ApiResponse<void>>(`/admin/payouts/${withdrawalRequestId}/manual-transfer`, payload);
    return response.data;
  }
};
