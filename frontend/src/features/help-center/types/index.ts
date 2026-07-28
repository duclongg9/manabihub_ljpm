export interface CommercialPolicy {
  currency: string;
  commissionRate: number;
  refundWindowDays: number;
  refundProgressLimitPercent: number;
  escrowHoldingDays: number;
  payoutThreshold: number;
  withdrawalFee: number;
  kycTargetDaysMin: number;
  kycTargetDaysMax: number;
  policyVersion: string;
  effectiveAt: string;
}
