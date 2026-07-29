import { useQuery } from '@tanstack/react-query';
import { teacherWalletService } from '../services/walletService';

export const teacherWalletSummaryKey = ['teacher-wallet', 'summary'] as const;
export const teacherWalletEscrowKey = ['teacher-wallet', 'escrow'] as const;
export const teacherWalletWithdrawalsKey = ['teacher-wallet', 'withdrawals'] as const;

export function useTeacherWallet() {
  const summary = useQuery({
    queryKey: teacherWalletSummaryKey,
    queryFn: teacherWalletService.getSummary,
    staleTime: 30_000,
  });

  const escrow = useQuery({
    queryKey: teacherWalletEscrowKey,
    queryFn: teacherWalletService.getPendingEscrow,
    staleTime: 30_000,
  });

  const withdrawals = useQuery({
    queryKey: teacherWalletWithdrawalsKey,
    queryFn: teacherWalletService.getWithdrawalHistory,
    staleTime: 30_000,
  });

  return {
    summary: summary.data,
    isSummaryLoading: summary.isLoading,
    isSummaryError: summary.isError,
    refetchSummary: summary.refetch,
    pendingEscrow: escrow.data ?? [],
    isEscrowLoading: escrow.isLoading,
    isEscrowError: escrow.isError,
    withdrawals: withdrawals.data ?? [],
    isWithdrawalsLoading: withdrawals.isLoading,
    isWithdrawalsError: withdrawals.isError,
  };
}
