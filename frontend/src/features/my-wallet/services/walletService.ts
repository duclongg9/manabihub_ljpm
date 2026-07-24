import { axiosClient } from '../../../shared/api/axiosClient';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type { TeacherWallet, WithdrawalRequest, CreateWithdrawalPayload } from '../types/wallet.types';

export const walletService = {
  getTeacherWallet: async (): Promise<ApiResponse<TeacherWallet>> => {
    const response = await axiosClient.get('/teacher/wallet');
    return response.data;
  },

  getTeacherWithdrawals: async (params?: any): Promise<ApiResponse<PageResponse<WithdrawalRequest>>> => {
    const response = await axiosClient.get('/teacher/withdrawals', { params });
    return response.data;
  },

  getWithdrawalDetail: async (id: string): Promise<ApiResponse<WithdrawalRequest>> => {
    const response = await axiosClient.get(`/teacher/withdrawals/${id}`);
    return response.data;
  },

  createWithdrawal: async (payload: CreateWithdrawalPayload): Promise<ApiResponse<WithdrawalRequest>> => {
    const response = await axiosClient.post('/teacher/withdrawals', payload);
    return response.data;
  },

  cancelWithdrawal: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosClient.put(`/teacher/withdrawals/${id}/cancel`);
    return response.data;
  },

  sendWithdrawalOtp: async (): Promise<ApiResponse<void>> => {
    const response = await axiosClient.post('/teacher/withdrawals/send-otp');
    return response.data;
  },

  getSavedBankAccounts: async (): Promise<ApiResponse<import('../types/wallet.types').TeacherBankAccount[]>> => {
    const response = await axiosClient.get('/teacher/withdrawals/bank-accounts');
    return response.data;
  },
};
