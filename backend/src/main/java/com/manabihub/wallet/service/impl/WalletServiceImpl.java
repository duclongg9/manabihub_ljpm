package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.mapper.WalletMapper;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final TeacherWalletRepository teacherWalletRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final WalletMapper walletMapper;

    @Value("${manabihub.wallet.minimum-payout-amount:500000}")
    private BigDecimal minimumPayoutAmount;

    @Override
    @Transactional(readOnly = true)
    public TeacherWalletResponse getTeacherWalletByUserId(UUID userId) {
        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.KYC_TEACHER_NOT_FOUND,
                        "Teacher profile not found",
                        HttpStatus.NOT_FOUND));

        TeacherWallet wallet = teacherWalletRepository.findByTeacherId(teacherProfile.getId())
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        // Hardcoding clearing period and next payout date for now as per requirement constraints
        int clearingPeriodDays = 14; 
        LocalDate nextPayoutDate = LocalDate.now().plusDays(14); 

        return walletMapper.toResponse(wallet, minimumPayoutAmount, clearingPeriodDays, nextPayoutDate);
    }

    @Override
    @Transactional
    public Wallet getOrCreatePlatformWallet() {
        return walletRepository.findFirstByOwnerType(WalletOwnerType.PLATFORM)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .ownerType(WalletOwnerType.PLATFORM)
                        .build()));
    }

    @Override
    @Transactional
    public Wallet getOrCreateTeacherWallet(TeacherProfile teacher) {
        return walletRepository.findByOwnerTypeAndTeacher_Id(WalletOwnerType.TEACHER, teacher.getId())
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .ownerType(WalletOwnerType.TEACHER)
                        .teacher(teacher)
                        .build()));
    }

    @Override
    @Transactional
    public WalletTransaction holdEscrow(TeacherProfile teacher, BigDecimal amount,
                                        String referenceType, UUID referenceId, String note) {
        Wallet wallet = getOrCreateTeacherWallet(teacher);
        Wallet locked = walletRepository.findByIdForUpdate(wallet.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Teacher wallet was not found",
                        HttpStatus.NOT_FOUND));

        locked.setFrozenBalance(locked.getFrozenBalance().add(amount));
        walletRepository.save(locked);

        return transactionRepository.save(WalletTransaction.builder()
                .walletId(locked.getId())
                .transactionType(WalletTransactionType.ESCROW_HOLD)
                .amount(amount)
                .direction(WalletDirection.IN)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .note(note)
                .build());
    }

    @Override
    @Transactional
    public void reserveBalance(String teacherId, BigDecimal amount, String withdrawalId) {
        TeacherWallet wallet = teacherWalletRepository.findByTeacherIdForUpdate(UUID.fromString(teacherId))
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        // V002 schema does not have a explicit frozen flag on the wallet itself.
        // We just check if available balance is sufficient.

        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new BusinessException(MessageCodes.WALLET_INSUFFICIENT_BALANCE, "Insufficient available balance");
        }

        // Update balances for V002 schema
        // Available balance is inherently (balance - frozenBalance)
        // To reserve money, we just increase frozenBalance. The total balance remains unchanged until actual payout.
        wallet.setFrozenBalance(wallet.getFrozenBalance().add(amount));
        
        teacherWalletRepository.save(wallet);

        // Create Transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .walletId(wallet.getId())
                .transactionType(WalletTransactionType.WITHDRAWAL_RESERVATION)
                .amount(amount.negate()) // negative for deduction from available
                .direction(WalletDirection.OUT)
                .referenceType("WITHDRAWAL_REQUEST")
                .referenceId(UUID.fromString(withdrawalId))
                .build();
                
        transactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public void releaseBalance(String teacherId, BigDecimal amount, String withdrawalId) {
        TeacherWallet wallet = teacherWalletRepository.findByTeacherIdForUpdate(UUID.fromString(teacherId))
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        if (wallet.getFrozenBalance().compareTo(amount) < 0) {
            throw new BusinessException(MessageCodes.WALLET_INSUFFICIENT_BALANCE, "Insufficient frozen balance to release");
        }

        // Update balances: decrease frozen, which inherently increases available balance
        wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(amount));
        
        teacherWalletRepository.save(wallet);

        // Create Transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .walletId(wallet.getId())
                .transactionType(WalletTransactionType.WITHDRAWAL_CANCELLED)
                .amount(amount) // positive for adding back to available
                .direction(WalletDirection.IN)
                .referenceType("WITHDRAWAL_REQUEST")
                .referenceId(UUID.fromString(withdrawalId))
                .note("Refund for cancelled withdrawal")
                .build();
                
        transactionRepository.save(transaction);
    }
}
