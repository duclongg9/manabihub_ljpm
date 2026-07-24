import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPayoutService } from "../services/adminPayoutService";
import { toast } from "react-hot-toast";

export const useApprovePayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (withdrawalRequestId: string) => adminPayoutService.approvePayout(withdrawalRequestId),
    onSuccess: () => {
      toast.success("Payout settlement approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to approve payout");
    }
  });
};
