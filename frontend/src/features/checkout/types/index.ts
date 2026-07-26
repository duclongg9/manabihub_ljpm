export interface CheckoutResponse {
  orderId: string;
  orderCode: string;
  amount: number;
  currency: string;
  status: string;
  /** Provider payment URL for paid courses; null for free courses (enrolled immediately). */
  paymentUrl: string | null;
}

export interface OrderItemResponse {
  courseId: string;
  courseTitle: string;
  courseThumbnailUrl?: string | null;
  price: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  items: OrderItemResponse[];
}

/** Raw acknowledgement returned by the VNPay IPN / dev-simulator endpoint. */
export interface IpnAck {
  RspCode: string;
  Message: string;
}
