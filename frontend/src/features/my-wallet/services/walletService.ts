import { axiosClient } from '../../../shared/api/axiosClient';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type { TeacherWallet, WithdrawalRequest, CreateWithdrawalPayload } from '../types/wallet.types';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export const walletService = {
  getTeacherWallet: async (): Promise<ApiResponse<TeacherWallet>> => {
    const response = await axiosClient.get(ENDPOINTS.teacherWallet.detail);
    return response.data;
  },

  getTeacherWithdrawals: async (params?: any): Promise<ApiResponse<PageResponse<WithdrawalRequest>>> => {
    const response = await axiosClient.get(ENDPOINTS.teacherWallet.withdrawals, { params });
    return response.data;
  },

  getTeacherEscrowLedger: async (params?: any): Promise<ApiResponse<PageResponse<import('../types/wallet.types').EscrowLedgerItem>>> => {
    // The endpoint is /api/v1/teacher/wallet/escrow
    // Wait, I should add it to ENDPOINTS or just hardcode it here.
    const response = await axiosClient.get('/api/v1/teacher/wallet/escrow', { params });
    return response.data;
  },

  getWithdrawalDetail: async (id: string): Promise<ApiResponse<WithdrawalRequest>> => {
    const response = await axiosClient.get(ENDPOINTS.teacherWallet.withdrawalDetail(id));
    return response.data;
  },

  createWithdrawal: async (payload: CreateWithdrawalPayload): Promise<ApiResponse<WithdrawalRequest>> => {
    const response = await axiosClient.post(ENDPOINTS.teacherWallet.withdrawals, payload);
    return response.data;
  },

  cancelWithdrawal: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosClient.put(ENDPOINTS.teacherWallet.cancelWithdrawal(id));
    return response.data;
  },

  sendWithdrawalOtp: async (): Promise<ApiResponse<void>> => {
    const response = await axiosClient.post(ENDPOINTS.teacherWallet.sendWithdrawalOtp);
    return response.data;
  },

  getSavedBankAccounts: async (): Promise<ApiResponse<import('../types/wallet.types').TeacherBankAccount[]>> => {
    const response = await axiosClient.get(ENDPOINTS.teacherWallet.bankAccounts);
    return response.data;
  },
};
