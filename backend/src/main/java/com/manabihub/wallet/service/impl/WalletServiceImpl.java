package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletLedgerType;
import com.manabihub.wallet.mapper.WalletMapper;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final TeacherWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final WalletMapper walletMapper;

    @Value("${manabihub.wallet.minimum-payout-amount:500000}")
    private BigDecimal minimumPayoutAmount;

    @Override
    @Transactional(readOnly = true)
    public TeacherWalletResponse getTeacherWallet(String teacherId) {
        TeacherWallet wallet = walletRepository.findByTeacherId(java.util.UUID.fromString(teacherId))
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        // Hardcoding clearing period and next payout date for now as per requirement constraints
        int clearingPeriodDays = 14; 
        LocalDate nextPayoutDate = LocalDate.now().plusDays(14); 

        return walletMapper.toResponse(wallet, minimumPayoutAmount, clearingPeriodDays, nextPayoutDate);
    }

    @Override
    @Transactional
    public void reserveBalance(String teacherId, BigDecimal amount, String withdrawalId) {
        TeacherWallet wallet = walletRepository.findByTeacherIdForUpdate(java.util.UUID.fromString(teacherId))
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        // V002 schema does not have a explicit frozen flag on the wallet itself.
        // We just check if available balance is sufficient.

        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new BusinessException(MessageCodes.WALLET_INSUFFICIENT_BALANCE, "Insufficient available balance");
        }

        BigDecimal balanceBefore = wallet.getAvailableBalance();
        
        // Update balances for V002 schema
        // Available balance is inherently (balance - frozenBalance)
        // To reserve money, we just increase frozenBalance. The total balance remains unchanged until actual payout.
        wallet.setFrozenBalance(wallet.getFrozenBalance().add(amount));
        
        walletRepository.save(wallet);

        // Create Transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .walletId(wallet.getId())
                .transactionType(WalletLedgerType.WITHDRAWAL_RESERVATION)
                .amount(amount.negate()) // negative for deduction from available
                .direction("OUT")
                .referenceType("WITHDRAWAL_REQUEST")
                .referenceId(java.util.UUID.fromString(withdrawalId))
                .build();
                
        transactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public void releaseBalance(String teacherId, BigDecimal amount, String withdrawalId) {
        TeacherWallet wallet = walletRepository.findByTeacherIdForUpdate(java.util.UUID.fromString(teacherId))
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        if (wallet.getFrozenBalance().compareTo(amount) < 0) {
            throw new BusinessException(MessageCodes.WALLET_INSUFFICIENT_BALANCE, "Insufficient frozen balance to release");
        }

        BigDecimal balanceBefore = wallet.getAvailableBalance();
        
        // Update balances: decrease frozen, which inherently increases available balance
        wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(amount));
        
        walletRepository.save(wallet);

        // Create Transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .walletId(wallet.getId())
                .transactionType(WalletLedgerType.WITHDRAWAL_CANCELLED) 
                .amount(amount) // positive for adding back to available
                .direction("IN")
                .referenceType("WITHDRAWAL_REQUEST")
                .referenceId(java.util.UUID.fromString(withdrawalId))
                .note("Refund for cancelled withdrawal")
                .build();
                
        transactionRepository.save(transaction);
    }
}
