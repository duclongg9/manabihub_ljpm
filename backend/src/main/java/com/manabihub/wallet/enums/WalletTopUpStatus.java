package com.manabihub.wallet.enums;

/**
 * Student wallet top-up request status.
 * <p>
 * NFR-SEC-14: a top-up starts as {@link #PENDING} and may only become
 * {@link #SUCCEEDED} after the backend confirms the payment gateway result.
 */
public enum WalletTopUpStatus {

    /** Created, waiting for gateway confirmation. */
    PENDING,

    /** Gateway confirmed; balance has been credited. */
    SUCCEEDED,

    /** Gateway rejected or timed out. */
    FAILED,

    /** Cancelled by the student before payment. */
    CANCELLED
}
