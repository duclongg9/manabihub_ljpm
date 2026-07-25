package com.manabihub.wallet.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * UC-17 alternative flow 4a: Student starts a wallet top-up.
 *
 * @param amount amount to add, in the wallet currency
 */
public record CreateWalletTopUpRequest(

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1000", message = "Amount must be at least 1,000")
        @DecimalMax(value = "50000000", message = "Amount must not exceed 50,000,000")
        @Digits(integer = 10, fraction = 2, message = "Amount format is invalid")
        BigDecimal amount
) {
}
