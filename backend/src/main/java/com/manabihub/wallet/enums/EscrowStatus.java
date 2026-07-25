package com.manabihub.wallet.enums;

/**
 * Escrow ledger status. Mirrors {@code chk_escrow_ledger_status}.
 * <p>
 * SRS trace: BR-ESC-01, BR-ESC-02.
 */
public enum EscrowStatus {

    /** Pending Clearing: revenue is held and not withdrawable (BR-ESC-01). */
    HELD,

    /** Clearing period passed, revenue moved to Available Balance (BR-ESC-02). */
    RELEASED,

    /** Revenue reversed because the underlying order was refunded. */
    REFUNDED,

    /** Blocked by a moderation or dispute decision (BR-WAL-03). */
    FROZEN
}
