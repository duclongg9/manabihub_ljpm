package com.manabihub.wallet.service;

import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.entity.WalletTransaction;

import java.math.BigDecimal;
import java.util.UUID;

public interface WalletService {
    TeacherWalletResponse getTeacherWalletByUserId(UUID userId);

    Wallet getOrCreatePlatformWallet();

    Wallet getOrCreateTeacherWallet(TeacherProfile teacher);

    /**
     * Returns the given student's wallet, creating an empty one (zero balance) on first use.
     * Used by the UC-17 "My Wallet" view and credited by the wallet top-up flow.
     */
    Wallet getOrCreateStudentWallet(StudentProfile student);

    /**
     * Moves {@code amount} into the teacher's frozen (held) balance and records an
     * {@code ESCROW_HOLD} ledger line. The teacher's spendable balance is unchanged;
     * releasing the hold is handled by a later payout use case.
     */
    WalletTransaction holdEscrow(TeacherProfile teacher, BigDecimal amount,
                                 String referenceType, UUID referenceId, String note);

    /**
     * Adds {@code amount} to the wallet's spendable balance and records the matching
     * {@code IN} ledger line, under a pessimistic row lock so concurrent credits cannot
     * lose an update (NFR-REL-06).
     * <p>
     * This method is deliberately unconditional: callers own the decision of <em>whether</em>
     * to credit. The wallet top-up flow (UC-17) only reaches here after the provider's
     * checksum-verified callback has been matched to a still-uncredited top-up, which is
     * what makes the overall operation at-most-once.
     *
     * @return the ledger line recording the credit
     */
    WalletTransaction credit(Wallet wallet, BigDecimal amount, WalletTransactionType type,
                             String referenceType, UUID referenceId, String note);

    WalletTransaction releaseEscrow(TeacherProfile teacher, BigDecimal amount,
                                    String referenceType, UUID referenceId, String note);
    WalletTransaction refundHeldEscrow(TeacherProfile teacher, BigDecimal amount,
                                       String referenceType, UUID referenceId, String note);
    
    /**
     * Reserves balance for withdrawal.
     * Must be called within a transactional context from the payout module.
     *
     * @param teacherId teacher ID
     * @param amount amount to reserve
     * @param withdrawalId reference ID for the ledger
     */
    void reserveBalance(String teacherId, BigDecimal amount, String withdrawalId);
    
    /**
     * Releases reserved balance back to available balance upon cancellation.
     * Must be called within a transactional context.
     *
     * @param teacherId teacher ID
     * @param amount amount to release
     * @param withdrawalId reference ID for the ledger
     */
    void releaseBalance(String teacherId, BigDecimal amount, String withdrawalId);

>>>>>>> origin/develop
}
