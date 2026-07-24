package com.manabihub.wallet.service;

import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import java.math.BigDecimal;

public interface WalletService {
    TeacherWalletResponse getTeacherWallet(String teacherId);
    
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
}
