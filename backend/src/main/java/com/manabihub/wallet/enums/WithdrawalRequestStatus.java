package com.manabihub.wallet.enums;

import java.util.Set;

/**
 * Teacher withdrawal request status. Mirrors
 * {@code chk_withdrawal_requests_status}.
 */
public enum WithdrawalRequestStatus {

    /** Waiting for Finance Manager review (amount is reserved). */
    PENDING,

    /** Approved, waiting for settlement execution (amount is reserved). */
    APPROVED,

    /** Rejected; the reserved amount returns to Available Balance. */
    REJECTED,

    /** Settlement executed successfully. */
    EXECUTED,

    /** Settlement attempted and failed. */
    FAILED;

    private static final Set<WithdrawalRequestStatus> RESERVING =
            Set.of(PENDING, APPROVED);

    /**
     * Statuses that still hold Available Balance aside (BR-WAL-01).
     */
    public static Set<WithdrawalRequestStatus> reservingStatuses() {
        return RESERVING;
    }

    /**
     * Whether this request currently reserves part of the Available Balance.
     */
    public boolean reservesBalance() {
        return RESERVING.contains(this);
    }
}
