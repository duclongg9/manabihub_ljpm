import { useQuery } from "@tanstack/react-query";
import { adminPayoutService } from "../services/adminPayoutService";

export const usePayoutDetail = (withdrawalRequestId: string | undefined) => {
  return useQuery({
    queryKey: ["admin-payout-detail", withdrawalRequestId],
    queryFn: () => adminPayoutService.getPayoutDetail(withdrawalRequestId!),
    enabled: !!withdrawalRequestId,
  });
};
