package com.manabihub.wallet.enums;

/**
 * UI-facing grouping of a wallet ledger line or order/payment record, used by the
 * UC-17 "My Wallet" view to bucket activity into role-appropriate sections.
 * <p>
 * Not persisted — derived at read time from {@code WalletTransactionType} (and, for
 * {@code ADJUSTMENT} entries, the ledger line's {@code referenceType}).
 */
public enum WalletTransactionSection {
    /** Student: money added to the wallet balance. */
    TOP_UP,
    /** Student: money spent on a course purchase. */
    PAYMENT,
    /** Student: money returned after a refund. */
    REFUND,
    /** Teacher: funds moved into the frozen/escrow balance after a sale. */
    ESCROW_HOLD,
    /** Teacher: funds released from escrow into the spendable balance. */
    ESCROW_RELEASE,
    /** Teacher: funds withdrawn out of the wallet (payout). */
    WITHDRAWAL,
    /** Teacher: platform revenue-share credit. */
    REVENUE_SHARE,
    /** Manual/administrative balance correction that is not a top-up. */
    ADJUSTMENT,
    /** Anything that does not fit the buckets above. */
    OTHER
}
