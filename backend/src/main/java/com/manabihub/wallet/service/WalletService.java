package com.manabihub.wallet.service;

import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Manages wallets and their ledger entries.
 * <p>
 * Designed to be reused by both UC-08 (course purchase escrow) and the later
 * wallet top-up flow, hence the generic {@code referenceType}/{@code referenceId} linkage.
 */
public interface WalletService {

    Wallet getOrCreatePlatformWallet();

    Wallet getOrCreateTeacherWallet(TeacherProfile teacher);

    /**
     * Moves {@code amount} into the teacher's frozen (held) balance and records an
     * {@code ESCROW_HOLD} ledger line. The teacher's spendable balance is unchanged;
     * releasing the hold is handled by a later payout use case.
     */
    WalletTransaction holdEscrow(TeacherProfile teacher, BigDecimal amount,
                                 String referenceType, UUID referenceId, String note);
}
