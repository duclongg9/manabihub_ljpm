import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type { CheckoutResponse } from '../../checkout/types';
import type {
  StudentWalletResponse,
  WalletTransaction,
  WalletTransactionDetail,
  WalletTransactionFilter,
} from '../types';
import { toTransactionParams } from './walletTransactionParams';

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

/** UC-17: paginated + filterable wallet transaction history for the current student. */
export async function getStudentWalletTransactions(
  filter: WalletTransactionFilter = {},
): Promise<PageResponse<WalletTransaction>> {
  const response = await axiosClient.get<ApiResponse<PageResponse<WalletTransaction>>>(
    ENDPOINTS.student.walletTransactions,
    { params: toTransactionParams(filter) },
  );
  return response.data.data;
}

/** UC-17 flow 6a: detail of one transaction plus its related order/refund reference. */
export async function getStudentWalletTransactionDetail(
  transactionId: string,
): Promise<WalletTransactionDetail> {
  const response = await axiosClient.get<ApiResponse<WalletTransactionDetail>>(
    ENDPOINTS.student.walletTransactionDetail(transactionId),
  );
  return response.data.data;
}
