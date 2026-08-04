import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiResponse } from '../../../shared/types/api';
import type { CheckoutResponse } from '../../checkout/types';
import type { StudentWalletResponse } from '../types';

/** Fetches the current student's money-wallet overview (balance). */
export async function getStudentWallet(): Promise<StudentWalletResponse> {
  const response = await axiosClient.get<ApiResponse<StudentWalletResponse>>(ENDPOINTS.student.wallet);
  return response.data.data;
}

/**
 * Creates a wallet top-up order and initiates payment; returns the VNPay payment URL.
 * Confirmation happens only via the backend IPN — the frontend never marks it paid.
 */
export async function topUpWallet(amount: number): Promise<CheckoutResponse> {
  const response = await axiosClient.post<ApiResponse<CheckoutResponse>>(
    ENDPOINTS.student.walletTopUp,
    { amount },
  );
  return response.data.data;
}
