package com.manabihub.payout.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.util.EncryptionUtil;
import com.manabihub.common.mail.EmailService;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.notification.service.NotificationService;
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
import com.manabihub.payout.service.WithdrawalService;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalServiceImpl implements WithdrawalService {

    private final WithdrawalRequestRepository withdrawalRepository;
    private final TeacherWalletRepository teacherWalletRepository;
    private final TeacherBankAccountRepository bankAccountRepository;
    private final AppUserRepository appUserRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final EmailService emailService;
    private final WalletService walletService;
    private final WithdrawalMapper withdrawalMapper;
    private final NotificationService notificationService;

    @Value("${manabihub.wallet.minimum-payout-amount:500000}")
    private BigDecimal minimumPayoutAmount;

    private static class OtpEntry {
        String code;
        long expiresAt;
        OtpEntry(String code) {
            this.code = code;
            this.expiresAt = System.currentTimeMillis() + 5 * 60 * 1000; // 5 mins
        }
    }
    private final java.util.concurrent.ConcurrentHashMap<String, OtpEntry> otpCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    @Transactional
    public WithdrawalRequestResponse createWithdrawalRequest(String userId, CreateWithdrawalRequest request) {
        if (request.getAmount().compareTo(minimumPayoutAmount) < 0) {
            throw new BusinessException(MessageCodes.PAYOUT_AMOUNT_BELOW_MINIMUM, "Amount below minimum threshold");
        }

        // Validate OTP
        OtpEntry entry = otpCache.get(userId);
        if (entry == null || !entry.code.equals(request.getOtpCode()) || System.currentTimeMillis() > entry.expiresAt) {
            throw new BusinessException("PAYOUT_INVALID_OTP", "Invalid or expired OTP");
        }
        otpCache.remove(userId);

        UUID teacherProfileId = resolveTeacherProfileId(userId);

        // Business Rule: Check for existing PENDING request
        long pendingCount = withdrawalRepository.countByTeacherIdAndStatus(
                teacherProfileId,
                WithdrawalStatus.PENDING
        );
        if (pendingCount > 0) {
            throw new BusinessException(MessageCodes.PAYOUT_PENDING_REQUEST_EXISTS, "You already have a pending withdrawal request.");
        }

        // Business Rule: Limit to 2 per month
        // In a real app, query by month, but here we simplify by counting this month's requests
        long monthlyCount = withdrawalRepository.countByTeacherIdAndCreatedAtAfter(
                teacherProfileId,
                java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0)
        );
        if (monthlyCount >= 2) {
            throw new BusinessException(MessageCodes.PAYOUT_MONTHLY_LIMIT_EXCEEDED, "You can only make 2 withdrawal requests per month.");
        }

        BankAccountSnapshot snapshot = buildSnapshot(request);

        // Fetch wallet ID to link the request
        TeacherWallet wallet = teacherWalletRepository.findByTeacherId(teacherProfileId)
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Wallet not found"));

        // Create the withdrawal request first to get an ID for the ledger
        WithdrawalRequest withdrawalRequest = WithdrawalRequest.builder()
                .teacherId(teacherProfileId)
                .requestedAmount(request.getAmount())
                .status(WithdrawalStatus.PENDING)
                .bankAccountSnapshot(snapshot)
                .build();
        
        // Save to generate ID
        withdrawalRequest = withdrawalRepository.save(withdrawalRequest);

        // Reserve balance (This uses pessimistic locking and validates funds)
        walletService.reserveBalance(
                teacherProfileId.toString(),
                request.getAmount(),
                withdrawalRequest.getId().toString()
        );

        // Send notification
        try {
            notificationService.createNotificationForRole(
                    "ADMIN", // Or FINANCE_MANAGER depending on roles, using ADMIN for now
                    "Yêu cầu rút doanh thu mới",
                    "Giáo viên vừa yêu cầu rút " + request.getAmount() + " VND.",
                    "SYSTEM",
                    "/admin/payouts/" + withdrawalRequest.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification for withdrawal request {}", withdrawalRequest.getId(), e);
            // Notification failure shouldn't rollback the financial transaction
        }

        // Save bank account if requested
        if (request.isSaveAccount()) {
            saveTeacherBankAccount(teacherProfileId, request.getBankAccount());
        }

        return withdrawalMapper.toResponse(withdrawalRequest);
    }

    private void saveTeacherBankAccount(UUID teacherId, BankAccountDto dto) {
        var existing = bankAccountRepository.findByTeacherIdAndAccountNumber(teacherId, dto.getAccountNumber());
        if (existing.isEmpty()) {
            TeacherBankAccount newAccount = TeacherBankAccount.builder()
                    .teacherId(teacherId)
                    .bankCode(dto.getBankCode())
                    .bankName(dto.getBankName())
                    .accountNumber(dto.getAccountNumber())
                    .accountHolderName(dto.getAccountHolderName())
                    .branch(dto.getBranch())
                    .isDefault(false) // Let user set default later if needed
                    .build();
            bankAccountRepository.save(newAccount);
        }
    }

    private BankAccountSnapshot buildSnapshot(CreateWithdrawalRequest request) {
        if (request.getBankAccount() != null) {
            BankAccountDto dto = request.getBankAccount();
            return BankAccountSnapshot.builder()
                    .bankCode(dto.getBankCode())
                    .bankName(dto.getBankName())
                    .accountHolderName(dto.getAccountHolderName())
                    .accountNumber(dto.getAccountNumber())
                    .branch(dto.getBranch())
                    .build();
        } else {
            throw new BusinessException(MessageCodes.PAYOUT_BANK_ACCOUNT_REQUIRED, "Bank account object must be provided");
        }
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
        WithdrawalRequest request = withdrawalRepository.findByIdAndTeacherId(
                        UUID.fromString(withdrawalId),
                        teacherProfileId
                )
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_WITHDRAWAL_NOT_FOUND, "Withdrawal request not found"));

        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new BusinessException("PAYOUT_CANNOT_CANCEL", "Only pending withdrawals can be cancelled");
        }

        request.setStatus(WithdrawalStatus.CANCELLED);
        withdrawalRepository.save(request);

        // Refund the reserved balance
        walletService.releaseBalance(
                teacherProfileId.toString(),
                request.getRequestedAmount(),
                withdrawalId
        );

        // Send notification
        try {
            notificationService.createNotificationForRole(
                    "TEACHER",
                    "Đã hủy lệnh rút tiền",
                    "Bạn đã hủy thành công lệnh rút tiền " + request.getRequestedAmount() + " VND.",
                    "SYSTEM",
                    "/teacher/wallet"
            );
        } catch (Exception e) {
            log.warn("Failed to send notification for withdrawal cancellation {}", withdrawalId, e);
        }
    }

    @Override
    public void sendWithdrawalOtp(String userId) {
        UUID userUuid = UUID.fromString(userId);
        
        AppUser teacher = appUserRepository.findById(userUuid)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Teacher not found"));
                
        if (teacher.getEmail() == null || teacher.getEmail().isEmpty()) {
            throw new BusinessException("PAYOUT_EMAIL_REQUIRED", "Teacher does not have an email address configured");
        }

        // Generate 6 digit OTP
        String code = String.format("%06d", new java.util.Random().nextInt(1000000));
        otpCache.put(userId, new OtpEntry(code));
        
        // Send email
        String subject = "[ManabiHub] Mã xác thực rút tiền doanh thu";
        String body = "<p>Xin chào,</p>" +
                      "<p>Bạn vừa yêu cầu rút tiền từ Ví Doanh Thu trên ManabiHub. Mã xác thực (OTP) của bạn là:</p>" +
                      "<h2 style=\"color: #2563eb; letter-spacing: 5px;\">" + code + "</h2>" +
                      "<p>Mã này sẽ hết hạn trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>" +
                      "<br><p>Trân trọng,<br>Đội ngũ ManabiHub</p>";
                      
        emailService.sendEmail(teacher.getEmail(), subject, body);
        log.info("OTP sent to teacher user {} at email {}", userId, teacher.getEmail());
    }

    @Override
    public java.util.List<TeacherBankAccountResponse> getSavedBankAccounts(String userId) {
        UUID teacherProfileId = resolveTeacherProfileId(userId);
        return bankAccountRepository.findByTeacherIdOrderByCreatedAtDesc(teacherProfileId).stream()
                .map(account -> TeacherBankAccountResponse.builder()
                        .id(account.getId().toString())
                        .bankCode(account.getBankCode())
                        .bankName(account.getBankName())
                        .accountNumber(account.getAccountNumber())
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
}
