package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

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

        // Re-load under a pessimistic lock so concurrent holds cannot lose an update.
        Wallet locked = walletRepository.findByIdForUpdate(wallet.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Teacher wallet was not found",
                        HttpStatus.NOT_FOUND));

        locked.setFrozenBalance(locked.getFrozenBalance().add(amount));
        walletRepository.save(locked);

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(locked)
                .transactionType(WalletTransactionType.ESCROW_HOLD)
                .amount(amount)
                .direction(WalletDirection.IN)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .note(note)
                .build();

        return walletTransactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public WalletTransaction reverseEscrowHold(TeacherProfile teacher, BigDecimal amount,
                                        String referenceType, UUID referenceId, String note) {
        Wallet wallet = getOrCreateTeacherWallet(teacher);

        Wallet locked = walletRepository.findByIdForUpdate(wallet.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Teacher wallet was not found",
                        HttpStatus.NOT_FOUND));

        locked.setFrozenBalance(locked.getFrozenBalance().subtract(amount));
        walletRepository.save(locked);

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(locked)
                .transactionType(WalletTransactionType.ESCROW_RELEASE)
                .amount(amount)
                .direction(WalletDirection.OUT)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .note(note)
                .build();

        return walletTransactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public WalletTransaction refundWallet(TeacherProfile teacher, BigDecimal amount,
                                   String referenceType, UUID referenceId, String note) {
        Wallet wallet = getOrCreateTeacherWallet(teacher);

        Wallet locked = walletRepository.findByIdForUpdate(wallet.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Teacher wallet was not found",
                        HttpStatus.NOT_FOUND));

        locked.setBalance(locked.getBalance().subtract(amount));
        walletRepository.save(locked);

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(locked)
                .transactionType(WalletTransactionType.REFUND)
                .amount(amount)
                .direction(WalletDirection.OUT)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .note(note)
                .build();

        return walletTransactionRepository.save(transaction);
    }
}
