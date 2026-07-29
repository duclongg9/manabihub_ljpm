package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.WalletTransactionSection;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A single line of wallet activity (a ledger transaction, or an order/payment/refund
 * record surfaced from the order/payment modules) shown in the UC-17 "My Wallet" view.
 *
 * @param section        UI grouping bucket (top-up/payment/refund for students;
 *                        escrow/withdrawal/revenue-share for teachers)
 * @param sourceType      origin of this line, e.g. {@code PURCHASE}, {@code PAYOUT}, {@code ORDER}
 * @param direction        {@code IN} or {@code OUT} relative to the wallet owner
 * @param status           lifecycle status label (e.g. order status, or {@code COMPLETED} for
 *                         immutable ledger lines)
 * @param referenceCode    human-readable reference (order code, or the linked ledger reference id)
 */
public record WalletActivityResponse(
        UUID id,
        WalletTransactionSection section,
        String sourceType,
        BigDecimal amount,
        String currency,
        String direction,
        String status,
        String referenceCode,
        String note,
        Instant occurredAt
) {
}
