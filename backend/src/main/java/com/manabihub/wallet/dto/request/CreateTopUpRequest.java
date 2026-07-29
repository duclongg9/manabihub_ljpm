package com.manabihub.wallet.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Student request to add money to their own wallet (UC-17, alternative flow 4a).
 * The wallet is never named in the payload — it is always resolved from the
 * authenticated principal, so a student cannot top up someone else's wallet (BR-RBAC-01).
 */
public record CreateTopUpRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "10000", message = "Minimum top-up amount is 10,000 VND")
        @DecimalMax(value = "50000000", message = "Maximum top-up amount is 50,000,000 VND")
        BigDecimal amount
) {
}
