import { useQuery } from '@tanstack/react-query';
import { studentWalletService } from '../services/walletService';

export const studentWalletSummaryKey = ['student-wallet', 'summary'] as const;
export const studentWalletTransactionsKey = ['student-wallet', 'transactions'] as const;

export function useStudentWallet() {
  const summary = useQuery({
    queryKey: studentWalletSummaryKey,
    queryFn: studentWalletService.getSummary,
    staleTime: 30_000,
  });

  const transactions = useQuery({
    queryKey: studentWalletTransactionsKey,
    queryFn: studentWalletService.getTransactions,
    staleTime: 30_000,
  });

  return {
    summary: summary.data,
    isSummaryLoading: summary.isLoading,
    isSummaryError: summary.isError,
    refetchSummary: summary.refetch,
    transactions: transactions.data ?? [],
    isTransactionsLoading: transactions.isLoading,
    isTransactionsError: transactions.isError,
    refetchTransactions: transactions.refetch,
  };
}
