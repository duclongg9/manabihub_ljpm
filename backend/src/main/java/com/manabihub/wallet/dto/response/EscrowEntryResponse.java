package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.EscrowStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A single escrow ledger entry for a teacher's "pending escrow" section (UC-17).
 */
public record EscrowEntryResponse(
        UUID id,
        UUID orderId,
        String orderCode,
        UUID courseId,
        String courseTitle,
        BigDecimal amount,
        String currency,
        EscrowStatus status,
        Instant releaseAt,
        Instant createdAt
) {
}
