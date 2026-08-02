package com.manabihub.wallet.dto.response;

import java.math.BigDecimal;

/**
 * Student money-wallet overview (MHB-37).
 */
public record StudentWalletResponse(
        BigDecimal balance,
        BigDecimal frozenBalance,
        BigDecimal availableBalance,
        String currency
) {
}
