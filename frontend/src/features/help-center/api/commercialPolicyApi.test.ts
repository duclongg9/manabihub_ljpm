import { describe, expect, it } from 'vitest';
import {
  parseCommercialPolicy,
  PROVISIONAL_COMMERCIAL_POLICY,
} from './commercialPolicyApi';

describe('provisional commercial policy', () => {
  it('matches the reviewed development contract and uses a stable effective date', () => {
    expect(PROVISIONAL_COMMERCIAL_POLICY).toMatchObject({
      currency: 'VND',
      commissionRate: 0.2,
      refundWindowDays: 7,
      refundProgressLimitPercent: 30,
      escrowHoldingDays: 14,
      payoutThreshold: 100_000,
      withdrawalFee: 0,
      policyVersion: 'provisional-2026-07-28',
      effectiveAt: '2026-07-28T00:00:00+07:00',
    });
  });

  it('fails closed when the backend omits or corrupts a public policy field', () => {
    expect(() => parseCommercialPolicy({
      ...PROVISIONAL_COMMERCIAL_POLICY,
      commissionRate: 20,
    })).toThrow('Invalid commercial policy response');

    const { kycTargetDaysMax: _omitted, ...incompletePolicy } = PROVISIONAL_COMMERCIAL_POLICY;
    expect(() => parseCommercialPolicy(incompletePolicy))
      .toThrow('Invalid commercial policy response');
  });
});
