import type { CommercialPolicy } from '../types';

// Mock backend API response based on section 4.7 of the brief
export const getCommercialPolicy = async (): Promise<CommercialPolicy> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // NOTE: These are provisional values for UI shell development ONLY.
  // When PR 1 backend API is ready, this should fetch from:
  // GET /api/v1/public/commercial-policy/current
  return {
    currency: 'VND',
    commissionRate: 0.20,
    refundWindowDays: 7,
    refundProgressLimitPercent: 20, // Example fallback for current backend setting
    escrowHoldingDays: 14,
    payoutThreshold: 100000,
    withdrawalFee: 0,
    kycTargetDaysMin: 1,
    kycTargetDaysMax: 2,
    policyVersion: '1.0.0-provisional',
    effectiveAt: new Date().toISOString(),
  };
};
