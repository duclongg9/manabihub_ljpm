import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageResponse } from '../../../shared/types/api';
import { walletService } from '../services/walletService';
import type {
  StudentWalletOverview,
  TeacherWalletOverview,
  WalletTopUp,
  WalletTransaction,
  WalletTransactionQuery,
  WithdrawalRequestItem,
} from '../types/walletTypes';

const WALLET_KEY = 'my-wallet';

export const walletKeys = {
  studentOverview: [WALLET_KEY, 'student', 'overview'] as const,
  studentTransactions: (query: WalletTransactionQuery) =>
    [WALLET_KEY, 'student', 'transactions', query] as const,
  studentTopUps: (page: number) => [WALLET_KEY, 'student', 'top-ups', page] as const,
  teacherOverview: [WALLET_KEY, 'teacher', 'overview'] as const,
  teacherTransactions: (query: WalletTransactionQuery) =>
    [WALLET_KEY, 'teacher', 'transactions', query] as const,
  teacherWithdrawals: (page: number) => [WALLET_KEY, 'teacher', 'withdrawals', page] as const,
};

/** UC-17 step 4: Student wallet overview. `enabled` keeps it off for Teachers. */
export const useStudentWallet = (enabled: boolean) =>
  useQuery<StudentWalletOverview>({
    queryKey: walletKeys.studentOverview,
    queryFn: walletService.getStudentWallet,
    enabled,
  });

/** UC-17 step 5: Teacher wallet overview. */
export const useTeacherWallet = (enabled: boolean) =>
  useQuery<TeacherWalletOverview>({
    queryKey: walletKeys.teacherOverview,
    queryFn: walletService.getTeacherWallet,
    enabled,
  });

/** UC-17 step 6: filtered transaction history for the active role. */
export const useWalletTransactions = (
  role: 'STUDENT' | 'TEACHER',
  query: WalletTransactionQuery,
  enabled = true,
) =>
  useQuery<PageResponse<WalletTransaction>>({
    queryKey:
      role === 'STUDENT'
        ? walletKeys.studentTransactions(query)
        : walletKeys.teacherTransactions(query),
    queryFn: () =>
      role === 'STUDENT'
        ? walletService.getStudentTransactions(query)
        : walletService.getTeacherTransactions(query),
    enabled,
  });

export const useStudentTopUps = (page: number, enabled: boolean) =>
  useQuery<PageResponse<WalletTopUp>>({
    queryKey: walletKeys.studentTopUps(page),
    queryFn: () => walletService.getStudentTopUps({ page, size: 5 }),
    enabled,
  });

export const useTeacherWithdrawals = (page: number, enabled: boolean) =>
  useQuery<PageResponse<WithdrawalRequestItem>>({
    queryKey: walletKeys.teacherWithdrawals(page),
    queryFn: () => walletService.getTeacherWithdrawals({ page, size: 10 }),
    enabled,
  });

/**
 * UC-17 alternative flow 4a. The balance does not change here — the backend
 * only records a pending request — so we refresh the overview to show it.
 */
export const useCreateTopUp = () => {
  const queryClient = useQueryClient();

  return useMutation<WalletTopUp, unknown, number>({
    mutationFn: (amount: number) => walletService.createTopUp(amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.studentOverview });
      void queryClient.invalidateQueries({ queryKey: [WALLET_KEY, 'student', 'top-ups'] });
    },
  });
};
