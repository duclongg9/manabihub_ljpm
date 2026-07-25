/**
 * UC-17 Manage My Wallet — shared types.
 *
 * Mirrors the backend DTOs in `com.manabihub.wallet.dto.response`.
 * The Student and Teacher shapes are intentionally separate: the wallet screen
 * is shared, but the data each role may see is not (BR-RBAC-01).
 */

export type WalletTransactionType =
  | 'TOP_UP'
  | 'PURCHASE'
  | 'REFUND'
  | 'REVENUE_SHARE'
  | 'PAYOUT'
  | 'ADJUSTMENT'
  | 'ESCROW_HOLD'
  | 'ESCROW_RELEASE';

export type WalletTransactionDirection = 'IN' | 'OUT';

export type WalletTopUpStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export type WithdrawalRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED';

export type PayoutSettlementStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RECONCILIATION_MISMATCH';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  balanceAfter: number | null;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface WalletTopUp {
  id: string;
  referenceCode: string;
  amount: number;
  currency: string;
  status: WalletTopUpStatus;
  createdAt: string;
  confirmedAt: string | null;
}

export interface StudentWalletOverview {
  walletId: string;
  currency: string;
  balance: number;
  pendingTopUpAmount: number;
  totalToppedUp: number;
  totalSpent: number;
  totalRefunded: number;
  canTopUp: boolean;
  recentTopUps: WalletTopUp[];
}

export interface TeacherWalletOverview {
  walletId: string;
  currency: string;
  availableBalance: number;
  pendingEscrowAmount: number;
  frozenBalance: number;
  reservedByWithdrawals: number;
  withdrawableBalance: number;
  minimumPayoutThreshold: number;
  totalRevenue: number;
  totalPaidOut: number;
  walletFrozen: boolean;
  canRequestWithdrawal: boolean;
  /** MSG-WALLET-001 / MSG-WALLET-003, or null when withdrawal is allowed. */
  blockedMessageCode: string | null;
}

export interface WithdrawalRequestItem {
  id: string;
  amount: number;
  status: WithdrawalRequestStatus;
  requestedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  payoutStatus: PayoutSettlementStatus | null;
  payoutReference: string | null;
  payoutExecutedAt: string | null;
}

export interface WalletTransactionQuery {
  type?: WalletTransactionType;
  direction?: WalletTransactionDirection;
  page?: number;
  size?: number;
}
