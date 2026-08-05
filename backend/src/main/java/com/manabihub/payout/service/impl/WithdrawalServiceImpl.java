package com.manabihub.payout.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.payout.dto.request.BankAccountDto;
import com.manabihub.payout.dto.request.CreateWithdrawalRequest;
import com.manabihub.payout.dto.response.TeacherBankAccountResponse;
import com.manabihub.payout.dto.response.WithdrawalRequestResponse;
import com.manabihub.payout.entity.BankAccountSnapshot;
import com.manabihub.payout.entity.TeacherBankAccount;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.mapper.WithdrawalMapper;
import com.manabihub.payout.repository.TeacherBankAccountRepository;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
import com.manabihub.payout.security.PayoutSecurityService;
import com.manabihub.payout.service.WithdrawalService;
import com.manabihub.payout.service.WithdrawalOtpService;
import com.manabihub.payout.service.WithdrawalNotificationService;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalServiceImpl implements WithdrawalService {

    private final WithdrawalRequestRepository withdrawalRepository;
    private final WalletRepository walletRepository;
    private final TeacherBankAccountRepository bankAccountRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final WalletService walletService;
    private final WithdrawalMapper withdrawalMapper;
    private final WithdrawalNotificationService notificationService;
    private final WithdrawalOtpService otpService;
    private final PayoutSecurityService securityService;
    private final CommercialPolicyService commercialPolicyService;

    @Override
    @Transactional
    public WithdrawalRequestResponse createWithdrawalRequest(String userId, CreateWithdrawalRequest request) {
        BigDecimal configuredPayoutThreshold =
                commercialPolicyService.getCurrentPolicy().payoutThreshold();
        if (request.getAmount().compareTo(configuredPayoutThreshold) < 0) {
            throw new BusinessException(MessageCodes.PAYOUT_AMOUNT_BELOW_MINIMUM, "Amount below minimum threshold");
        }

        UUID teacherProfileId = resolveTeacherProfileId(userId);

        // Serialize withdrawal creation per teacher across all application instances.
        var wallet = walletRepository.findTeacherWalletForUpdate(teacherProfileId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Wallet not found"
                ));

        long pendingCount = withdrawalRepository.countByTeacherIdAndStatus(
                teacherProfileId,
                WithdrawalStatus.PENDING
        );
        if (pendingCount > 0) {
            throw new BusinessException(MessageCodes.PAYOUT_PENDING_REQUEST_EXISTS, "You already have a pending withdrawal request.");
        }

        long monthlyCount = withdrawalRepository.countByTeacherIdAndCreatedAtAfter(
                teacherProfileId,
                java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0)
        );
        if (monthlyCount >= 2) {
            throw new BusinessException(MessageCodes.PAYOUT_MONTHLY_LIMIT_EXCEEDED, "You can only make 2 withdrawal requests per month.");
        }

        BankAccountSnapshot snapshot = buildSnapshot(teacherProfileId, request);
        otpService.consumeOtp(userId, request.getOtpCode());

        WithdrawalRequest withdrawalRequest = WithdrawalRequest.builder()
                .teacherId(teacherProfileId)
                .walletId(wallet.getId())
                .ownerType(WalletOwnerType.TEACHER)
                .requestedAmount(request.getAmount())
                .status(WithdrawalStatus.PENDING)
                .bankAccountSnapshot(snapshot)
                .build();
        
        try {
            withdrawalRequest = withdrawalRepository.saveAndFlush(withdrawalRequest);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_PENDING_REQUEST_EXISTS,
                    "You already have a pending withdrawal request.",
                    HttpStatus.CONFLICT,
                    exception
            );
        }

        walletService.reserveBalance(
                teacherProfileId.toString(),
                request.getAmount(),
                withdrawalRequest.getId().toString()
        );

        UUID withdrawalId = withdrawalRequest.getId();
        notifyAfterCommit(
                () -> notificationService.notifyFinanceManager(
                        withdrawalId,
                        request.getAmount()
                ),
                "withdrawal request " + withdrawalId
        );

        if (request.isSaveAccount() && request.getBankAccount() != null) {
            saveTeacherBankAccount(teacherProfileId, request.getBankAccount());
        }

        return withdrawalMapper.toResponse(withdrawalRequest);
    }

    private void saveTeacherBankAccount(UUID teacherId, BankAccountDto dto) {
        String fingerprint = securityService.fingerprintAccountNumber(dto.getAccountNumber());
        var existing = bankAccountRepository.findByTeacherIdAndAccountFingerprint(
                teacherId,
                fingerprint
        );
        if (existing.isEmpty()) {
            TeacherBankAccount newAccount = TeacherBankAccount.builder()
                    .teacherId(teacherId)
                    .bankCode(dto.getBankCode())
                    .bankName(dto.getBankName())
                    .accountNumber(securityService.encryptAccountNumber(dto.getAccountNumber()))
                    .accountFingerprint(fingerprint)
                    .accountHolderName(dto.getAccountHolderName())
                    .branch(dto.getBranch())
                    .isDefault(false)
                    .build();
            bankAccountRepository.save(newAccount);
        }
    }

    private BankAccountSnapshot buildSnapshot(
            UUID teacherId,
            CreateWithdrawalRequest request
    ) {
        if (request.getBankAccountId() != null && !request.getBankAccountId().isBlank()) {
            UUID accountId;
            try {
                accountId = UUID.fromString(request.getBankAccountId());
            } catch (IllegalArgumentException exception) {
                throw new BusinessException(
                        MessageCodes.PAYOUT_BANK_ACCOUNT_REQUIRED,
                        "Saved bank account was not found"
                );
            }
            TeacherBankAccount account = bankAccountRepository
                    .findByIdAndTeacherId(accountId, teacherId)
                    .orElseThrow(() -> new BusinessException(
                            MessageCodes.PAYOUT_BANK_ACCOUNT_REQUIRED,
                            "Saved bank account was not found"
                    ));
            return BankAccountSnapshot.builder()
                    .bankCode(account.getBankCode())
                    .bankName(account.getBankName())
                    .accountHolderName(account.getAccountHolderName())
                    .accountNumber(account.getAccountNumber())
                    .branch(account.getBranch())
                    .build();
        }

        BankAccountDto dto = request.getBankAccount();
        if (dto == null) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_BANK_ACCOUNT_REQUIRED,
                    "Bank account must be provided"
            );
        }
        return BankAccountSnapshot.builder()
                .bankCode(dto.getBankCode())
                .bankName(dto.getBankName())
                .accountHolderName(dto.getAccountHolderName())
                .accountNumber(securityService.encryptAccountNumber(dto.getAccountNumber()))
                .branch(dto.getBranch())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawalRequestResponse> getTeacherWithdrawals(String userId, Pageable pageable) {
        UUID teacherProfileId = resolveTeacherProfileId(userId);
        return withdrawalRepository.findByTeacherId(teacherProfileId, pageable)
                .map(withdrawalMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawalRequestResponse getWithdrawalDetail(String userId, String withdrawalId) {
        UUID teacherProfileId = resolveTeacherProfileId(userId);
        WithdrawalRequest request = withdrawalRepository.findByIdAndTeacherId(
                        UUID.fromString(withdrawalId),
                        teacherProfileId
                )
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_WITHDRAWAL_NOT_FOUND, "Withdrawal request not found"));
        return withdrawalMapper.toResponse(request);
    }

    @Override
    @Transactional
    public void cancelWithdrawal(String userId, String withdrawalId) {
        UUID teacherProfileId = resolveTeacherProfileId(userId);
        WithdrawalRequest request = withdrawalRepository.findByIdAndTeacherIdWithLock(
                        UUID.fromString(withdrawalId),
                        teacherProfileId
                )
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_WITHDRAWAL_NOT_FOUND, "Withdrawal request not found"));

        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new BusinessException("PAYOUT_CANNOT_CANCEL", "Only pending withdrawals can be cancelled");
        }

        request.setStatus(WithdrawalStatus.CANCELLED);
        withdrawalRepository.save(request);

        walletService.releaseBalance(
                teacherProfileId.toString(),
                request.getRequestedAmount(),
                withdrawalId
        );

        notifyAfterCommit(
                () -> notificationService.notifyTeacherCancellation(
                        UUID.fromString(userId),
                        request.getRequestedAmount()
                ),
                "withdrawal cancellation " + withdrawalId
        );
    }

    @Override
    public void sendWithdrawalOtp(String userId) {
        otpService.sendOtp(userId);
    }

    @Override
    public java.util.List<TeacherBankAccountResponse> getSavedBankAccounts(String userId) {
        UUID teacherProfileId = resolveTeacherProfileId(userId);
        return bankAccountRepository.findByTeacherIdOrderByCreatedAtDesc(teacherProfileId).stream()
                .map(account -> TeacherBankAccountResponse.builder()
                        .id(account.getId().toString())
                        .bankCode(account.getBankCode())
                        .bankName(account.getBankName())
                        .accountNumber(securityService.maskAccountNumber(account.getAccountNumber()))
                        .accountHolderName(account.getAccountHolderName())
                        .branch(account.getBranch())
                        .isDefault(account.isDefault())
                        .build())
                .toList();
    }

    private UUID resolveTeacherProfileId(String userId) {
        UUID userUuid = UUID.fromString(userId);
        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userUuid)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.KYC_TEACHER_NOT_FOUND,
                        "Teacher profile not found"
                ));
        return teacherProfile.getId();
    }

    private void notifyAfterCommit(Runnable notification, String operation) {
        Runnable safeNotification = () -> {
            try {
                notification.run();
            } catch (Exception exception) {
                log.warn("Failed to send notification for {}", operation, exception);
            }
        };

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            safeNotification.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        safeNotification.run();
                    }
                }
        );
    }
}
