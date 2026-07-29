package com.manabihub.wallet.enums;

/**
 * A read-only, derived summary of a teacher's payout readiness for the UC-17 "My Wallet"
 * view. Computed from the teacher wallet's balance/frozen balance — there is no dedicated
 * payout-request entity yet (teacher payout settlement is tracked by MHB-40).
 */
public enum PayoutStatus {
    /** No escrow held and nothing available to withdraw. */
    NO_ACTIVITY,
    /** Funds are currently held in escrow and not yet withdrawable. */
    ESCROW_PENDING,
    /** Funds have cleared escrow and are available for withdrawal. */
    AVAILABLE_FOR_PAYOUT
}
