import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiResponse } from '../../../shared/types/api';
import type { CheckoutResponse, IpnAck, OrderResponse } from '../types';

/** Creates an order for a course and initiates payment, returning the VNPay payment URL. */
export async function createCheckout(courseId: string): Promise<CheckoutResponse> {
  const response = await axiosClient.post<ApiResponse<CheckoutResponse>>(
    ENDPOINTS.orders.create,
    { courseId },
  );
  return response.data.data;
}

/** Fetches an order's current status — used to poll after returning from the payment provider. */
export async function getOrder(orderId: string): Promise<OrderResponse> {
  const response = await axiosClient.get<ApiResponse<OrderResponse>>(
    ENDPOINTS.orders.detail(orderId),
  );
  return response.data.data;
}

/**
 * Local-only helper: asks the backend to simulate a signed VNPay IPN callback for an order,
 * so the full confirmation flow can be exercised without a public tunnel to VNPay.
 */
export async function simulatePayment(orderCode: string, success = true): Promise<IpnAck> {
  const response = await axiosClient.post<IpnAck>(
    ENDPOINTS.payments.devIpn,
    null,
    { params: { orderCode, success } },
  );
  return response.data;
}

/**
 * Forwards the signed VNPay return params to the backend so it can verify the checksum and
 * confirm the order immediately after the browser is redirected back — without waiting for
 * the server-to-server IPN (which cannot reach localhost).
 */
export async function confirmVnPayReturn(params: Record<string, string>): Promise<IpnAck> {
  const response = await axiosClient.get<IpnAck>(ENDPOINTS.payments.confirmReturn, { params });
  return response.data;
}
