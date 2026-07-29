import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentWalletService } from '../services/walletService';
import { studentWalletSummaryKey, studentWalletTransactionsKey } from './useStudentWallet';

export const walletTopUpKey = (topUpId: string) => ['student-wallet', 'top-up', topUpId] as const;

/**
 * Creates a top-up request and hands back the provider payment URL (UC-17 alt. flow 4a).
 * Nothing is credited here — the caller redirects and the balance only changes once the
 * backend has verified the provider callback.
 */
export function useCreateTopUp() {
  return useMutation({
    mutationFn: (amount: number) => studentWalletService.createTopUp(amount),
  });
}

/**
 * Polls a top-up until it leaves PENDING, then stops. Used by the return page after the
 * provider redirects the browser back.
 *
 * @param enabled pass false to hold off until the return params have been forwarded
 */
export function useTopUpStatus(topUpId: string | null, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: walletTopUpKey(topUpId ?? ''),
    queryFn: async () => {
      const topUp = await studentWalletService.getTopUp(topUpId as string);
      if (topUp.status === 'SUCCESS') {
        // The balance and history are now stale — force the wallet page to refetch.
        queryClient.invalidateQueries({ queryKey: studentWalletSummaryKey });
        queryClient.invalidateQueries({ queryKey: studentWalletTransactionsKey });
      }
      return topUp;
    },
    enabled: Boolean(topUpId) && enabled,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 2000 : false),
    staleTime: 0,
  });
}
