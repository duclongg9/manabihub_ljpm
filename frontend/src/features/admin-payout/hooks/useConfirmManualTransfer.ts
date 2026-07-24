import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPayoutService } from "../services/adminPayoutService";
import type { ConfirmManualTransferPayload } from "../types/payout.types";
import { toast } from "react-hot-toast";

export const useConfirmManualTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ withdrawalRequestId, payload }: { withdrawalRequestId: string; payload: ConfirmManualTransferPayload }) => 
      adminPayoutService.confirmManualTransfer(withdrawalRequestId, payload),
    onSuccess: () => {
      toast.success("Manual transfer confirmed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to confirm manual transfer");
    }
  });
};
