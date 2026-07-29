package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.WalletTopUpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A wallet top-up request as seen by its owning student (UC-17).
 *
 * @param paymentUrl provider payment page to redirect the browser to; {@code null} once the
 *                   top-up has reached a terminal state (it is only issued at creation time)
 */
public record WalletTopUpResponse(
        UUID id,
        String topUpCode,
        BigDecimal amount,
        String currency,
        WalletTopUpStatus status,
        String provider,
        String paymentUrl,
        Instant createdAt,
        Instant updatedAt
) {
}
