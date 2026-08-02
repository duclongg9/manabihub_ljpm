package com.manabihub.wallet.service;

import com.manabihub.wallet.dto.response.StudentWalletResponse;
import com.manabihub.wallet.entity.StudentWallet;
import com.manabihub.wallet.entity.WalletTransaction;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Manages the student money wallet (MHB-37). Kept separate from teacher wallet logic.
 */
public interface StudentWalletService {

    StudentWallet getOrCreateStudentWallet(UUID studentId);

    /** Wallet overview (balance) for the authenticated student, resolved by their user id. */
    StudentWalletResponse getWalletOverview(UUID userId);

    /**
     * Credits {@code amount} to the student's spendable balance and records a {@code TOP_UP}
     * ledger line. Called from the payment webhook after a wallet-top-up order is confirmed.
     * Must run inside a transaction; locks the wallet row to avoid lost updates.
     */
    WalletTransaction creditBalance(UUID studentId, BigDecimal amount,
                                    String referenceType, UUID referenceId, String note);
}
