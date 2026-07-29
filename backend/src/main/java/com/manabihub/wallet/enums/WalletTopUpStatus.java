package com.manabihub.wallet.enums;

/**
 * Lifecycle of a wallet top-up request (UC-17).
 * <p>
 * Mirrors the {@code chk_wallet_topups_status} check constraint. {@code SUCCESS} is
 * terminal — it is the state that guards against double-crediting a replayed callback.
 */
public enum WalletTopUpStatus {
    /** Created locally; the payment provider has not confirmed anything yet. */
    PENDING,
    /** Provider confirmed the payment and the wallet balance has been credited. */
    SUCCESS,
    /** Provider reported a failed/cancelled payment; no balance was credited. */
    FAILED
}
