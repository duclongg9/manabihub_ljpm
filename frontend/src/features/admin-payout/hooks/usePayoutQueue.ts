import { useQuery } from "@tanstack/react-query";
import { adminPayoutService } from "../services/adminPayoutService";

export const usePayoutQueue = (params: any) => {
  return useQuery({
    queryKey: ["admin-payouts", params],
    queryFn: () => adminPayoutService.getPayoutQueue(params),
  });
};
