package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * One row of the UC-17 transaction history.
 *
 * @param id            ledger entry id
 * @param type          what the entry represents
 * @param direction     whether money entered or left the wallet
 * @param amount        absolute amount, always positive
 * @param balanceAfter  running balance after the entry, may be null for legacy rows
 * @param referenceType domain of {@code referenceId}, e.g. ORDER or PAYOUT
 * @param referenceId   related record, shown only when the caller may see it
 * @param note          human-readable description
 * @param createdAt     when the entry was recorded
 */
public record WalletTransactionResponse(
        UUID id,
        WalletTransactionType type,
        WalletTransactionDirection direction,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String referenceType,
        UUID referenceId,
        String note,
        Instant createdAt
) {
}
