package com.manabihub.wallet.enums;

import java.util.Set;

/**
 * Ledger entry type. Mirrors {@code chk_wallet_tx_type} (extended in V030).
 * <p>
 * UC-17 groups these into the sections each role is allowed to see.
 */
public enum WalletTransactionType {

    /** Student adds money to the wallet (UC-17 alternative flow 4a). */
    TOP_UP,

    /** Student pays for an order. */
    PURCHASE,

    /** Money returned to the Student after an approved refund. */
    REFUND,

    /** Teacher revenue share credited from a paid order. */
    REVENUE_SHARE,

    /** Teacher revenue transferred out through a payout settlement. */
    PAYOUT,

    /** Manual correction performed by an internal admin. */
    ADJUSTMENT,

    /** Revenue recorded as Pending Clearing (BR-ESC-01). */
    ESCROW_HOLD,

    /** Revenue moved from Pending Clearing to Available Balance (BR-ESC-02). */
    ESCROW_RELEASE;

    private static final Set<WalletTransactionType> STUDENT_TYPES =
            Set.of(TOP_UP, PURCHASE, REFUND, ADJUSTMENT);

    private static final Set<WalletTransactionType> TEACHER_TYPES =
            Set.of(REVENUE_SHARE, PAYOUT, ESCROW_HOLD, ESCROW_RELEASE, ADJUSTMENT);

    /**
     * Transaction types a Student wallet may legitimately contain.
     */
    public static Set<WalletTransactionType> studentTypes() {
        return STUDENT_TYPES;
    }

    /**
     * Transaction types a Teacher revenue wallet may legitimately contain.
     */
    public static Set<WalletTransactionType> teacherTypes() {
        return TEACHER_TYPES;
    }
}
