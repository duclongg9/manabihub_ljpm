import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPayoutService } from "../services/adminPayoutService";
import type { RejectPayoutPayload } from "../types/payout.types";
import { toast } from "react-hot-toast";

export const useRejectPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ withdrawalRequestId, payload }: { withdrawalRequestId: string; payload: RejectPayoutPayload }) => 
      adminPayoutService.rejectPayout(withdrawalRequestId, payload),
    onSuccess: () => {
      toast.success("Payout request rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reject payout");
    }
  });
};
