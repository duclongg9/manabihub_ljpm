export interface StudentWalletResponse {
  balance: number;
  frozenBalance: number;
  availableBalance: number;
  withdrawableBalance: number;
  availableWithdrawableBalance: number;
  currency: string;
}

export type StudentWithdrawalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED';

export interface StudentWithdrawal {
  id: string;
  requestedAmount: number;
  currency: string;
  status: StudentWithdrawalStatus;
  bankName?: string;
  accountHolderName?: string;
  accountNumberMasked?: string;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface StudentBankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch?: string;
  isDefault: boolean;
  ownershipVerified: boolean;
}

export interface CreateStudentWithdrawalPayload {
  amount: number;
  bankAccountId?: string;
  bankAccount?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    branch?: string;
  };
  otpCode: string;
  saveAccount: boolean;
  ownershipConfirmed: boolean;
}
