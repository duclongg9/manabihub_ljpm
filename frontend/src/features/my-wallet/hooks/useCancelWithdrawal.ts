import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/walletService';

export function useCancelWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => walletService.cancelWithdrawal(id),
    onSuccess: () => {
      // Invalidate both wallet balance and withdrawals list
      queryClient.invalidateQueries({ queryKey: ['teacherWallet'] });
      queryClient.invalidateQueries({ queryKey: ['teacherWithdrawals'] });
    },
  });
}
