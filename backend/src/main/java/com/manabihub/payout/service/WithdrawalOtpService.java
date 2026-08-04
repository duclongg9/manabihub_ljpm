package com.manabihub.payout.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.mail.EmailService;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.payout.entity.WithdrawalOtpChallenge;
import com.manabihub.payout.repository.WithdrawalOtpChallengeRepository;
import com.manabihub.payout.security.PayoutSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WithdrawalOtpService {

    private static final Duration OTP_LIFETIME = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final WithdrawalOtpChallengeRepository challengeRepository;
    private final AppUserRepository appUserRepository;
    private final EmailService emailService;
    private final PayoutSecurityService securityService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendOtp(String userId) {
        UUID userUuid = parseUserId(userId);
        AppUser teacher = appUserRepository.findByIdForUpdate(userUuid)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Teacher not found"
                ));
        if (teacher.getEmail() == null || teacher.getEmail().isBlank()) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_EMAIL_REQUIRED,
                    "Teacher does not have an email address configured"
            );
        }

        Instant now = Instant.now();
        WithdrawalOtpChallenge challenge = challengeRepository.findById(userUuid).orElse(null);
        if (challenge != null && challenge.getResendAvailableAt().isAfter(now)) {
            throw new BusinessException(
                    MessageCodes.PAYOUT_OTP_RATE_LIMITED,
                    "Please wait before requesting another OTP",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        String nonce = securityService.newOtpNonce();
        if (challenge == null) {
            challenge = WithdrawalOtpChallenge.builder()
                    .userId(userUuid)
                    .createdAt(now)
                    .build();
        }
        challenge.setNonce(nonce);
        challenge.setCodeHash(securityService.hashOtp(userUuid, nonce, code));
        challenge.setExpiresAt(now.plus(OTP_LIFETIME));
        challenge.setResendAvailableAt(now.plus(RESEND_COOLDOWN));
        challenge.setFailedAttempts(0);
        challenge.setUpdatedAt(now);
        challengeRepository.saveAndFlush(challenge);

        emailService.sendEmail(
                teacher.getEmail(),
                "[ManabiHub] Mã xác thực rút tiền doanh thu",
                "<p>Xin chào,</p>"
                        + "<p>Bạn vừa yêu cầu rút tiền từ Ví Doanh Thu trên ManabiHub. "
                        + "Mã xác thực (OTP) của bạn là:</p>"
                        + "<h2 style=\"color: #2563eb; letter-spacing: 5px;\">"
                        + code
                        + "</h2>"
                        + "<p>Mã này sẽ hết hạn trong vòng 5 phút. "
                        + "Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>"
                        + "<br><p>Trân trọng,<br>Đội ngũ ManabiHub</p>"
        );
        log.info("Withdrawal OTP sent for user {}", userUuid);
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = BusinessException.class
    )
    public void consumeOtp(String userId, String code) {
        UUID userUuid = parseUserId(userId);
        WithdrawalOtpChallenge challenge = challengeRepository.findByUserIdForUpdate(userUuid)
                .orElseThrow(() -> invalidOtp("Invalid or expired OTP"));
        Instant now = Instant.now();

        if (!challenge.getExpiresAt().isAfter(now)) {
            challengeRepository.delete(challenge);
            throw invalidOtp("Invalid or expired OTP");
        }
        if (challenge.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            throw invalidOtp("OTP attempt limit exceeded");
        }
        if (!securityService.otpMatches(
                userUuid,
                challenge.getNonce(),
                code,
                challenge.getCodeHash()
        )) {
            challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
            challenge.setUpdatedAt(now);
            challengeRepository.save(challenge);
            throw invalidOtp(
                    challenge.getFailedAttempts() >= MAX_FAILED_ATTEMPTS
                            ? "OTP attempt limit exceeded"
                            : "Invalid or expired OTP"
            );
        }

        challengeRepository.delete(challenge);
    }

    private UUID parseUserId(String userId) {
        try {
            return UUID.fromString(userId);
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(
                    MessageCodes.AUTH_UNAUTHORIZED,
                    "Invalid authenticated user"
            );
        }
    }

    private BusinessException invalidOtp(String message) {
        return new BusinessException(MessageCodes.PAYOUT_INVALID_OTP, message);
    }
}
