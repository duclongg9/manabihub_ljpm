package com.manabihub.wallet.service;

import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;

import java.util.List;

/**
 * Read-side service backing the teacher's "My Wallet" view (UC-17). Resolves the
 * wallet of the currently authenticated teacher and assembles the pending-escrow,
 * available-balance, withdrawal-history and payout-status sections.
 */
public interface TeacherWalletService {

    /** Wallet summary for the current teacher: available balance, pending escrow, payout status. */
    TeacherWalletSummaryResponse getWalletSummary();

    /** The current teacher's escrow entries that are still held (not yet released), newest first. */
    List<EscrowEntryResponse> getPendingEscrow();

    /** The current teacher's withdrawal (payout) history, newest first. */
    List<WalletActivityResponse> getWithdrawalHistory();
}
