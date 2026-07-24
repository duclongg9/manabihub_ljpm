export type PayoutStatus =
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "PENDING_RETRY"
  | "REJECTED";

export type ReconciliationStatus =
  | "MATCHED"
  | "WARNING"
  | "CRITICAL_MISMATCH"
  | "RESOLVED";

export type WithdrawalStatus =
  | "PENDING_REVIEW"
  | "PROCESSING"
  | "PAID"
  | "REJECTED"
  | "FAILED"
  | "PENDING_RETRY"
  | "CORRECTION_REQUIRED"
  | "CANCELLED";

export interface PayoutQueueItem {
  withdrawalRequestId: string;
  teacherId: string;
  teacherName: string;
  requestedAmount: number;
  status: WithdrawalStatus;
  reconciliationStatus: ReconciliationStatus;
  requestedAt: string;
}

export interface PayoutDetail {
  withdrawalRequestId: string;
  settlementId?: string;
  teacherId: string;
  teacherName: string;
  requestedAmount: number;
  availableBalance: number;
  reservedBalance: number;
  walletFrozen: boolean;
  status: WithdrawalStatus;
  reconciliationStatus: ReconciliationStatus;
  reconciliationAlerts: string[];
  bankName: string;
  bankBranch?: string;
  accountHolderName: string;
  accountNumberMasked: string;
  settlementStatus?: PayoutStatus;
  requestedAt: string;
  settledAt?: string;
  decisionReason?: string;
  gatewayReference?: string;
}

export interface RejectPayoutPayload {
  reason: string;
}

export interface ConfirmManualTransferPayload {
  transactionReference: string;
  transferredAmount: number;
  transferredAt: string;
  proofFileId?: string;
  note?: string;
}
