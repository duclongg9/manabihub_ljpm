package com.manabihub.wallet.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * UC-17 step 5: the Teacher view of My Wallet.
 * <p>
 * NFR-UX-24 requires Pending and Available balance to be clearly separated,
 * so they are two distinct fields and are never summed into a single number.
 *
 * @param walletId                wallet identifier
 * @param currency                wallet currency
 * @param availableBalance        cleared revenue on the wallet row
 * @param pendingEscrowAmount     revenue still Pending Clearing (BR-ESC-01)
 * @param frozenBalance           amount blocked by moderation (BR-WAL-03)
 * @param reservedByWithdrawals   amount held by open withdrawal requests
 * @param withdrawableBalance     available minus reserved, never negative (BR-WAL-01)
 * @param minimumPayoutThreshold  configured payout threshold (BR-WAL-02)
 * @param totalRevenue            lifetime revenue credited to the wallet
 * @param totalPaidOut            lifetime amount transferred out
 * @param walletFrozen            true when withdrawal is blocked (BR-WAL-03)
 * @param canRequestWithdrawal    true only when every BR-WAL rule passes
 * @param blockedMessageCode      MSG code explaining why withdrawal is blocked, else null
 */
public record TeacherWalletOverviewResponse(
        UUID walletId,
        String currency,
        BigDecimal availableBalance,
        BigDecimal pendingEscrowAmount,
        BigDecimal frozenBalance,
        BigDecimal reservedByWithdrawals,
        BigDecimal withdrawableBalance,
        BigDecimal minimumPayoutThreshold,
        BigDecimal totalRevenue,
        BigDecimal totalPaidOut,
        boolean walletFrozen,
        boolean canRequestWithdrawal,
        String blockedMessageCode
) {
}
