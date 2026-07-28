export type TeacherWallet = {
  pendingBalance: number;
  availableBalance: number;
  reservedBalance?: number;
  walletFrozen: boolean;
  minimumPayoutAmount: number;
  clearingPeriodDays: number;
  nextPayoutDate?: string;
};

export type WithdrawalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED';

export type WithdrawalRequest = {
  id: string;
  requestedAmount: number;
  currency: string;
  status: WithdrawalStatus;
  bankCode: string;
  bankName: string;
  accountHolderName: string;
  accountNumberMasked: string;
  branch?: string;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
};

export type BankAccountPayload = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch?: string;
};

export type TeacherBankAccount = {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch?: string;
  isDefault: boolean;
};

export type CreateWithdrawalPayload = {
  amount: number;
  bankAccountId?: string;
  bankAccount?: BankAccountPayload;
  otpCode: string;
  saveAccount: boolean;
};
