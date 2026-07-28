export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface RefundQueueResponse {
  id: string;
  orderId: string;
  orderCode: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reason: string;
  status: RefundStatus;
  createdAt: string;
}

export interface RefundDetailResponse {
  id: string;
  orderId: string;
  orderCode: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: RefundStatus;
  reason: string;
  eligibilitySnapshot: Record<string, any>;
  decidedBy?: string;
  decisionNote?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundDecisionRequest {
  note: string;
}
