package com.manabihub.wallet.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Role-scoped wallet summary for a student (UC-17). Never exposes escrow/payout
 * fields — those are teacher-only (BR-RBAC).
 */
public record StudentWalletSummaryResponse(
        UUID walletId,
        String currency,
        BigDecimal balance,
        BigDecimal totalTopUps,
        BigDecimal totalPayments,
        BigDecimal totalRefunds,
        Instant updatedAt
) {
}
