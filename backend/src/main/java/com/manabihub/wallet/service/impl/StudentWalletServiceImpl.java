package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.wallet.dto.response.StudentWalletResponse;
import com.manabihub.wallet.entity.StudentWallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.StudentWalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.StudentWalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentWalletServiceImpl implements StudentWalletService {

    private final StudentWalletRepository studentWalletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentWalletResponse getWalletOverview(UUID userId) {
        StudentProfile student = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found",
                        HttpStatus.NOT_FOUND));
        StudentWallet wallet = studentWalletRepository.findByStudentId(student.getId())
                .orElse(StudentWallet.builder().studentId(student.getId()).build());
        return new StudentWalletResponse(
                wallet.getBalance(),
                wallet.getFrozenBalance(),
                wallet.getAvailableBalance(),
                wallet.getCurrency());
    }

    @Override
    @Transactional
    public StudentWallet getOrCreateStudentWallet(UUID studentId) {
        return studentWalletRepository.findByStudentId(studentId)
                .orElseGet(() -> studentWalletRepository.save(StudentWallet.builder()
                        .ownerType("STUDENT")
                        .studentId(studentId)
                        .build()));
    }

    @Override
    @Transactional
    public WalletTransaction creditBalance(UUID studentId, BigDecimal amount,
                                           String referenceType, UUID referenceId, String note) {
        // Ensure the wallet exists, then re-load under a pessimistic lock before mutating.
        getOrCreateStudentWallet(studentId);
        StudentWallet wallet = studentWalletRepository.findByStudentIdForUpdate(studentId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Student wallet was not found",
                        HttpStatus.NOT_FOUND));

        wallet.setBalance(wallet.getBalance().add(amount));
        studentWalletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .walletId(wallet.getId())
                .transactionType(WalletTransactionType.TOP_UP)
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
    public WalletTransaction debitBalance(UUID studentId, BigDecimal amount,
                                          String referenceType, UUID referenceId, String note) {
        getOrCreateStudentWallet(studentId);
        StudentWallet wallet = studentWalletRepository.findByStudentIdForUpdate(studentId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Student wallet was not found",
                        HttpStatus.NOT_FOUND));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BusinessException(
                    MessageCodes.WALLET_INSUFFICIENT_BALANCE,
                    "Số dư ví không đủ để thanh toán",
                    HttpStatus.BAD_REQUEST);
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        studentWalletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .walletId(wallet.getId())
                .transactionType(WalletTransactionType.PURCHASE)
                .amount(amount)
                .direction(WalletDirection.OUT)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .note(note)
                .build();

        return walletTransactionRepository.save(transaction);
    }
}
