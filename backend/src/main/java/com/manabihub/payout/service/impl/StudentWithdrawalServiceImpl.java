package com.manabihub.payout.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.payout.dto.request.BankAccountDto;
import com.manabihub.payout.dto.request.CreateWithdrawalRequest;
import com.manabihub.payout.dto.response.StudentBankAccountResponse;
import com.manabihub.payout.dto.response.WithdrawalRequestResponse;
import com.manabihub.payout.entity.BankAccountSnapshot;
import com.manabihub.payout.entity.StudentBankAccount;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.mapper.WithdrawalMapper;
import com.manabihub.payout.repository.StudentBankAccountRepository;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
import com.manabihub.payout.security.PayoutSecurityService;
import com.manabihub.payout.service.StudentWithdrawalService;
import com.manabihub.payout.service.StudentBankOwnershipVerificationService;
import com.manabihub.payout.service.WithdrawalNotificationService;
import com.manabihub.payout.service.WithdrawalOtpService;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.service.StudentWalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentWithdrawalServiceImpl implements StudentWithdrawalService {
    private static final int MAX_MONTHLY_REQUESTS = 2;

    private final StudentProfileRepository studentProfileRepository;
    private final WalletRepository walletRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final StudentBankAccountRepository bankAccountRepository;
    private final StudentWalletService studentWalletService;
    private final WithdrawalOtpService otpService;
    private final WithdrawalMapper withdrawalMapper;
    private final PayoutSecurityService securityService;
    private final CommercialPolicyService commercialPolicyService;
    private final WithdrawalNotificationService notificationService;
    private final StudentBankOwnershipVerificationService ownershipVerificationService;

    @Override
    @Transactional
    public WithdrawalRequestResponse createWithdrawal(
            UUID userId,
            CreateWithdrawalRequest request
    ) {
        BigDecimal minimum = commercialPolicyService.getCurrentPolicy().payoutThreshold();
        if (request.getAmount().compareTo(minimum) < 0) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_AMOUNT_BELOW_MINIMUM,
                    "Amount below minimum withdrawal threshold");
        }

        StudentProfile student = requireStudent(userId);
        studentWalletService.getOrCreateStudentWallet(student.getId());
        Wallet wallet = walletRepository.findStudentWalletForUpdate(student.getId())
                .orElseThrow(this::walletNotFound);
        if (wallet.isFrozen()) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_BALANCE_FROZEN,
                    "Student wallet is frozen",
                    HttpStatus.CONFLICT);
        }
        if (wallet.getAvailableWithdrawableBalance().compareTo(request.getAmount()) < 0) {
            throw new BusinessException(
                    MessageCodes.WALLET_INSUFFICIENT_BALANCE,
                    "Insufficient withdrawable refund balance",
                    HttpStatus.BAD_REQUEST);
        }
        if (withdrawalRequestRepository.countByStudentIdAndStatus(
                student.getId(), WithdrawalStatus.PENDING) > 0) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_PENDING_REQUEST_EXISTS,
                    "You already have a pending withdrawal request",
                    HttpStatus.CONFLICT);
        }

        LocalDateTime monthStart = LocalDateTime.now()
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
        if (withdrawalRequestRepository.countByStudentIdAndCreatedAtAfter(
                student.getId(), monthStart) >= MAX_MONTHLY_REQUESTS) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_MONTHLY_LIMIT_EXCEEDED,
                    "You can only make 2 withdrawal requests per month");
        }

        BankAccountSnapshot snapshot = buildSnapshot(student.getId(), request);
        otpService.consumeOtp(userId.toString(), request.getOtpCode());

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .ownerType(WalletOwnerType.STUDENT)
                .studentId(student.getId())
                .walletId(wallet.getId())
                .requestedAmount(request.getAmount())
                .status(WithdrawalStatus.PENDING)
                .bankAccountSnapshot(snapshot)
                .build();
        try {
            withdrawal = withdrawalRequestRepository.saveAndFlush(withdrawal);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_PENDING_REQUEST_EXISTS,
                    "You already have a pending withdrawal request",
                    HttpStatus.CONFLICT,
                    exception);
        }

        studentWalletService.reserveForWithdrawal(
                student.getId(), withdrawal.getId(), request.getAmount());
        if (request.isSaveAccount() && request.getBankAccount() != null) {
            saveBankAccount(student.getId(), request.getBankAccount());
        }

        UUID withdrawalId = withdrawal.getId();
        BigDecimal amount = request.getAmount();
        notifyAfterCommit(() -> notificationService.notifyFinanceManager(
                withdrawalId, amount, "STUDENT"));
        return withdrawalMapper.toResponse(withdrawal);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawalRequestResponse> getMyWithdrawals(
            UUID userId,
            Pageable pageable
    ) {
        StudentProfile student = requireStudent(userId);
        return withdrawalRequestRepository.findByStudentId(student.getId(), pageable)
                .map(withdrawalMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawalRequestResponse getMyWithdrawal(UUID userId, UUID withdrawalId) {
        StudentProfile student = requireStudent(userId);
        return withdrawalRequestRepository.findByIdAndStudentId(withdrawalId, student.getId())
                .map(withdrawalMapper::toResponse)
                .orElseThrow(this::withdrawalNotFound);
    }

    @Override
    @Transactional
    public WithdrawalRequestResponse cancelWithdrawal(UUID userId, UUID withdrawalId) {
        StudentProfile student = requireStudent(userId);
        WithdrawalRequest withdrawal = withdrawalRequestRepository
                .findByIdAndStudentIdWithLock(withdrawalId, student.getId())
                .orElseThrow(this::withdrawalNotFound);
        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_INVALID_STATUS,
                    "Only pending withdrawals can be cancelled",
                    HttpStatus.CONFLICT);
        }

        studentWalletService.releaseWithdrawal(
                student.getId(),
                withdrawalId,
                withdrawal.getRequestedAmount(),
                WalletTransactionType.WITHDRAWAL_CANCELLED,
                "Student cancelled the withdrawal request");
        withdrawal.setStatus(WithdrawalStatus.CANCELLED);
        WithdrawalRequest saved = withdrawalRequestRepository.save(withdrawal);
        notifyAfterCommit(() -> notificationService.notifyCancellation(
                userId, withdrawal.getRequestedAmount()));
        return withdrawalMapper.toResponse(saved);
    }

    @Override
    public void sendOtp(UUID userId) {
        requireStudent(userId);
        otpService.sendOtp(userId.toString());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentBankAccountResponse> getSavedBankAccounts(UUID userId) {
        StudentProfile student = requireStudent(userId);
        return bankAccountRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream()
                .map(account -> StudentBankAccountResponse.builder()
                        .id(account.getId())
                        .bankCode(account.getBankCode())
                        .bankName(account.getBankName())
                        .accountNumber(securityService.maskAccountNumber(
                                account.getAccountNumber()))
                        .accountHolderName(account.getAccountHolderName())
                        .branch(account.getBranch())
                        .isDefault(account.isDefault())
                        .ownershipVerified(account.isOwnershipVerified())
                        .build())
                .toList();
    }

    private BankAccountSnapshot buildSnapshot(
            UUID studentId,
            CreateWithdrawalRequest request
    ) {
        if (request.getBankAccountId() != null && !request.getBankAccountId().isBlank()) {
            UUID accountId;
            try {
                accountId = UUID.fromString(request.getBankAccountId());
            } catch (IllegalArgumentException exception) {
                throw bankAccountRequired();
            }
            StudentBankAccount account = bankAccountRepository
                    .findByIdAndStudentId(accountId, studentId)
                    .orElseThrow(this::bankAccountRequired);
            StudentBankOwnershipVerificationService.VerificationEvidence evidence =
                    verifiedEvidence(account, request.isOwnershipConfirmed());
            return BankAccountSnapshot.builder()
                    .bankCode(account.getBankCode())
                    .bankName(account.getBankName())
                    .accountNumber(account.getAccountNumber())
                    .accountHolderName(account.getAccountHolderName())
                    .branch(account.getBranch())
                    .ownershipVerified(evidence.verified())
                    .ownershipVerificationMethod(evidence.method())
                    .ownershipVerifiedAt(evidence.verifiedAt())
                    .build();
        }

        BankAccountDto bank = request.getBankAccount();
        if (bank == null) {
            throw bankAccountRequired();
        }
        StudentBankOwnershipVerificationService.VerificationEvidence evidence =
                ownershipVerificationService.verify(request.isOwnershipConfirmed());
        return BankAccountSnapshot.builder()
                .bankCode(bank.getBankCode())
                .bankName(bank.getBankName())
                .accountNumber(securityService.encryptAccountNumber(bank.getAccountNumber()))
                .accountHolderName(bank.getAccountHolderName())
                .branch(bank.getBranch())
                .ownershipVerified(evidence.verified())
                .ownershipVerificationMethod(evidence.method())
                .ownershipVerifiedAt(evidence.verifiedAt())
                .build();
    }

    private void saveBankAccount(UUID studentId, BankAccountDto bank) {
        String fingerprint = securityService.fingerprintAccountNumber(bank.getAccountNumber());
        if (bankAccountRepository.findByStudentIdAndAccountFingerprint(
                studentId, fingerprint).isPresent()) {
            return;
        }
        bankAccountRepository.save(StudentBankAccount.builder()
                .studentId(studentId)
                .bankCode(bank.getBankCode())
                .bankName(bank.getBankName())
                .accountNumber(securityService.encryptAccountNumber(bank.getAccountNumber()))
                .accountFingerprint(fingerprint)
                .accountHolderName(bank.getAccountHolderName())
                .branch(bank.getBranch())
                .ownershipVerified(true)
                .ownershipVerificationMethod("MOCK_LOCAL")
                .ownershipVerifiedAt(LocalDateTime.now())
                .build());
    }

    private StudentBankOwnershipVerificationService.VerificationEvidence verifiedEvidence(
            StudentBankAccount account,
            boolean ownershipConfirmed
    ) {
        if (account.isOwnershipVerified()) {
            return new StudentBankOwnershipVerificationService.VerificationEvidence(
                    true,
                    account.getOwnershipVerificationMethod(),
                    account.getOwnershipVerifiedAt());
        }
        StudentBankOwnershipVerificationService.VerificationEvidence evidence =
                ownershipVerificationService.verify(ownershipConfirmed);
        account.setOwnershipVerified(evidence.verified());
        account.setOwnershipVerificationMethod(evidence.method());
        account.setOwnershipVerifiedAt(evidence.verifiedAt());
        bankAccountRepository.save(account);
        return evidence;
    }

    private StudentProfile requireStudent(UUID userId) {
        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found",
                        HttpStatus.NOT_FOUND));
    }

    private BusinessException walletNotFound() {
        return new BusinessException(
                MessageCodes.WALLET_NOT_FOUND,
                "Student wallet was not found",
                HttpStatus.NOT_FOUND);
    }

    private BusinessException withdrawalNotFound() {
        return new BusinessException(
                MessageCodes.PAYOUT_WITHDRAWAL_NOT_FOUND,
                "Withdrawal request was not found",
                HttpStatus.NOT_FOUND);
    }

    private BusinessException bankAccountRequired() {
        return new BusinessException(
                MessageCodes.PAYOUT_BANK_ACCOUNT_REQUIRED,
                "Bank account must be provided");
    }

    private void notifyAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        action.run();
                    }
                });
    }
}
