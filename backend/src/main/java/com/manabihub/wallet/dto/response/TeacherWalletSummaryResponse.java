package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.PayoutStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Role-scoped wallet summary for a teacher (UC-17): available balance, pending escrow,
 * total withdrawn to date, and a derived payout status. Never exposes student-only
 * fields such as top-up totals (BR-RBAC).
 */
public record TeacherWalletSummaryResponse(
        UUID walletId,
        String currency,
        BigDecimal availableBalance,
        BigDecimal pendingEscrowBalance,
        BigDecimal totalWithdrawn,
        PayoutStatus payoutStatus,
        Instant updatedAt
) {
}
