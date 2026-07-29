package com.manabihub.wallet.service;

import com.manabihub.wallet.dto.response.StudentWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;

import java.util.List;

/**
 * Read-side service backing the student's "My Wallet" view (UC-17). Resolves the
 * wallet of the currently authenticated student and assembles the top-up/payment/
 * refund sections from the wallet ledger and the student's orders.
 */
public interface StudentWalletService {

    /** Wallet summary for the current student: balance plus per-section totals. */
    StudentWalletSummaryResponse getWalletSummary();

    /**
     * All wallet activity for the current student — top-ups (wallet ledger),
     * payments and refunds (orders) — newest first.
     */
    List<WalletActivityResponse> getWalletActivity();
}
