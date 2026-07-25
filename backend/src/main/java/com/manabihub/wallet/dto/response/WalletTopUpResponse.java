package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.WalletTopUpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Result of creating or listing a wallet top-up request.
 *
 * @param id            top-up request id
 * @param referenceCode code the student quotes when paying or contacting support
 * @param amount        requested amount
 * @param currency      wallet currency
 * @param status        {@code PENDING} until the backend confirms the gateway result
 * @param createdAt     when the request was created
 * @param confirmedAt   when the payment was confirmed, null while pending
 */
public record WalletTopUpResponse(
        UUID id,
        String referenceCode,
        BigDecimal amount,
        String currency,
        WalletTopUpStatus status,
        Instant createdAt,
        Instant confirmedAt
) {
}
