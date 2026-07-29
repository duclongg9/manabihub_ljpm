import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  EscrowEntry,
  StudentWalletSummary,
  TeacherWalletSummary,
  WalletActivity,
  WalletTopUp,
} from '../types';

export const studentWalletService = {
  getSummary: async (): Promise<StudentWalletSummary> => {
    const response = await axiosClient.get<ApiResponse<StudentWalletSummary>>(
      ENDPOINTS.studentWallet.summary,
    );
    return response.data.data;
  },

  getTransactions: async (): Promise<WalletActivity[]> => {
    const response = await axiosClient.get<ApiResponse<WalletActivity[]>>(
      ENDPOINTS.studentWallet.transactions,
    );
    return response.data.data;
  },

  /**
   * Creates a top-up request (UC-17 alt. flow 4a). The wallet balance is untouched until the
   * payment provider confirms server-side, so the caller must redirect to `paymentUrl` and
   * then poll `getTopUp` rather than assuming success.
   */
  createTopUp: async (amount: number): Promise<WalletTopUp> => {
    const response = await axiosClient.post<ApiResponse<WalletTopUp>>(
      ENDPOINTS.studentWallet.topUps,
      { amount },
    );
    return response.data.data;
  },

  getTopUp: async (topUpId: string): Promise<WalletTopUp> => {
    const response = await axiosClient.get<ApiResponse<WalletTopUp>>(
      ENDPOINTS.studentWallet.topUpDetail(topUpId),
    );
    return response.data.data;
  },

  /**
   * Local-only helper: asks the backend to simulate a signed provider callback for a top-up,
   * so the confirmation path can be exercised without a public tunnel to VNPay.
   */
  simulateTopUp: async (topUpCode: string, success = true): Promise<void> => {
    await axiosClient.post(ENDPOINTS.payments.devWalletTopUpIpn, null, {
      params: { topUpCode, success },
    });
  },
};

export const teacherWalletService = {
  getSummary: async (): Promise<TeacherWalletSummary> => {
    const response = await axiosClient.get<ApiResponse<TeacherWalletSummary>>(
      ENDPOINTS.teacherWallet.summary,
    );
    return response.data.data;
  },

  getPendingEscrow: async (): Promise<EscrowEntry[]> => {
    const response = await axiosClient.get<ApiResponse<EscrowEntry[]>>(
      ENDPOINTS.teacherWallet.escrow,
    );
    return response.data.data;
  },

  getWithdrawalHistory: async (): Promise<WalletActivity[]> => {
    const response = await axiosClient.get<ApiResponse<WalletActivity[]>>(
      ENDPOINTS.teacherWallet.transactions,
    );
    return response.data.data;
  },
};
