package com.manabihub.wallet.enums;

/**
 * Payout settlement status. Mirrors {@code chk_payout_settlements_status}.
 */
public enum PayoutSettlementStatus {

    /** Settlement created but not yet executed. */
    PENDING,

    /** Money transferred to the teacher bank account. */
    SUCCESS,

    /** Transfer attempted and failed. */
    FAILED,

    /** Blocked because reconciliation does not match (BR-PAYOUT-02). */
    RECONCILIATION_MISMATCH
}
