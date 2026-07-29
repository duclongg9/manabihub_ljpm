export type WalletTransactionSection =
  | 'TOP_UP'
  | 'PAYMENT'
  | 'REFUND'
  | 'ESCROW_HOLD'
  | 'ESCROW_RELEASE'
  | 'WITHDRAWAL'
  | 'REVENUE_SHARE'
  | 'ADJUSTMENT'
  | 'OTHER';

export type PayoutStatus = 'NO_ACTIVITY' | 'ESCROW_PENDING' | 'AVAILABLE_FOR_PAYOUT';

export type EscrowStatus = 'HELD' | 'RELEASED' | 'REFUNDED' | 'FROZEN';

export interface StudentWalletSummary {
  walletId: string;
  currency: string;
  balance: number;
  totalTopUps: number;
  totalPayments: number;
  totalRefunds: number;
  updatedAt: string;
}

export interface TeacherWalletSummary {
  walletId: string;
  currency: string;
  availableBalance: number;
  pendingEscrowBalance: number;
  totalWithdrawn: number;
  payoutStatus: PayoutStatus;
  updatedAt: string;
}

export interface WalletActivity {
  id: string;
  section: WalletTransactionSection;
  sourceType: string;
  amount: number;
  currency: string;
  direction: 'IN' | 'OUT';
  status: string;
  referenceCode: string | null;
  note: string | null;
  occurredAt: string;
}

export interface EscrowEntry {
  id: string;
  orderId: string | null;
  orderCode: string | null;
  courseId: string | null;
  courseTitle: string | null;
  amount: number;
  currency: string;
  status: EscrowStatus;
  releaseAt: string | null;
  createdAt: string;
}

export type WalletTopUpStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface WalletTopUp {
  id: string;
  topUpCode: string;
  amount: number;
  currency: string;
  status: WalletTopUpStatus;
  provider: string;
  /** Provider payment page — only present on the response that created the request. */
  paymentUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * UC-17 normal flow step 6 — client-side narrowing of the activity list. `section: 'ALL'`
 * and empty date bounds mean "no constraint on that axis".
 */
export interface WalletActivityFilter {
  section: WalletTransactionSection | 'ALL';
  from: string;
  to: string;
  query: string;
}

export const EMPTY_ACTIVITY_FILTER: WalletActivityFilter = {
  section: 'ALL',
  from: '',
  to: '',
  query: '',
};
