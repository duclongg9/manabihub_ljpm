import { axiosClient as api } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type {
  StudentWalletOverview,
  TeacherWalletOverview,
  WalletTopUp,
  WalletTransaction,
  WalletTransactionQuery,
  WithdrawalRequestItem,
} from '../types/walletTypes';

/**
 * UC-17 API access.
 *
 * Student and Teacher use different endpoints on purpose — the backend enforces
 * the role, and keeping them apart here means the UI cannot accidentally ask
 * for data the current role may not see.
 */
export const walletService = {
  getStudentWallet: async (): Promise<StudentWalletOverview> => {
    const response = await api.get<ApiResponse<StudentWalletOverview>>(
      ENDPOINTS.wallet.studentWallet,
    );
    return response.data.data;
  },

  getStudentTransactions: async (
    query: WalletTransactionQuery,
  ): Promise<PageResponse<WalletTransaction>> => {
    const response = await api.get<ApiResponse<PageResponse<WalletTransaction>>>(
      ENDPOINTS.wallet.studentTransactions,
      { params: cleanParams(query) },
    );
    return response.data.data;
  },

  getStudentTopUps: async (
    params: { page: number; size: number },
  ): Promise<PageResponse<WalletTopUp>> => {
    const response = await api.get<ApiResponse<PageResponse<WalletTopUp>>>(
      ENDPOINTS.wallet.studentTopUps,
      { params },
    );
    return response.data.data;
  },

  createTopUp: async (amount: number): Promise<WalletTopUp> => {
    const response = await api.post<ApiResponse<WalletTopUp>>(
      ENDPOINTS.wallet.studentTopUps,
      { amount },
    );
    return response.data.data;
  },

  getTeacherWallet: async (): Promise<TeacherWalletOverview> => {
    const response = await api.get<ApiResponse<TeacherWalletOverview>>(
      ENDPOINTS.wallet.teacherWallet,
    );
    return response.data.data;
  },

  getTeacherTransactions: async (
    query: WalletTransactionQuery,
  ): Promise<PageResponse<WalletTransaction>> => {
    const response = await api.get<ApiResponse<PageResponse<WalletTransaction>>>(
      ENDPOINTS.wallet.teacherTransactions,
      { params: cleanParams(query) },
    );
    return response.data.data;
  },

  getTeacherWithdrawals: async (
    params: { page: number; size: number },
  ): Promise<PageResponse<WithdrawalRequestItem>> => {
    const response = await api.get<ApiResponse<PageResponse<WithdrawalRequestItem>>>(
      ENDPOINTS.wallet.teacherWithdrawals,
      { params },
    );
    return response.data.data;
  },
};

/** Drops undefined filters so axios does not send `type=undefined`. */
function cleanParams(query: WalletTransactionQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page ?? 0,
    size: query.size ?? 10,
  };
  if (query.type) {
    params.type = query.type;
  }
  if (query.direction) {
    params.direction = query.direction;
  }
  return params;
}
