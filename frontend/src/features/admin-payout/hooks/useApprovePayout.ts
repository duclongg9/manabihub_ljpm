import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminPayoutService } from '../services/adminPayoutService';
import { getPayoutErrorMessage } from '../services/payoutError';

export function useApprovePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (withdrawalRequestId: string) =>
      adminPayoutService.approvePayout(withdrawalRequestId),
    onSuccess: () => {
      toast.success('Đã quyết toán và ghi nhận giao dịch thành công.');
    },
    onError: (error: unknown) => {
      toast.error(getPayoutErrorMessage(error));
    },
    onSettled: (_data, _error, withdrawalRequestId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      void queryClient.invalidateQueries({
        queryKey: ['admin-payout', withdrawalRequestId],
      });
    },
  });
}
