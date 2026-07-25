package com.manabihub.wallet.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * UC-17 step 4: the Student view of My Wallet.
 * <p>
 * Acceptance criteria: the Student sees top-up, payment and refund sections.
 * Withdrawal fields are deliberately absent — a Student has no payout balance
 * (UC-17 exception 4b).
 *
 * @param walletId          wallet identifier
 * @param currency          ISO-like currency code of the wallet
 * @param balance           spendable balance
 * @param pendingTopUpAmount money sent to the gateway but not confirmed yet
 * @param totalToppedUp     lifetime confirmed top-up amount
 * @param totalSpent        lifetime course payment amount
 * @param totalRefunded     lifetime refunded amount
 * @param canTopUp          whether the top-up action is currently allowed
 * @param recentTopUps      latest top-up requests for the top-up section
 */
public record StudentWalletOverviewResponse(
        UUID walletId,
        String currency,
        BigDecimal balance,
        BigDecimal pendingTopUpAmount,
        BigDecimal totalToppedUp,
        BigDecimal totalSpent,
        BigDecimal totalRefunded,
        boolean canTopUp,
        List<WalletTopUpResponse> recentTopUps
) {
}
