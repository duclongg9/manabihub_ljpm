package com.manabihub.identity.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.util.PhoneNumberNormalizer;
import com.manabihub.identity.dto.response.PhoneVerificationResponse;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.PhoneVerificationChallenge;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.PhoneVerificationChallengeRepository;
import com.manabihub.payout.security.PayoutSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneVerificationService {

    private static final Duration OTP_LIFETIME = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final AppUserRepository appUserRepository;
    private final PhoneVerificationChallengeRepository challengeRepository;
    private final PayoutSecurityService securityService;
    private final SmsSender smsSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public PhoneVerificationResponse requestCode(UUID userId, String requestedPhoneNumber) {
        AppUser user = findUserForUpdate(userId);
        String phoneNumber = normalizeAndValidate(requestedPhoneNumber);

        if (user.getPhoneVerifiedAt() != null) {
            if (Objects.equals(user.getPhoneNumber(), phoneNumber)) {
                return new PhoneVerificationResponse(user.getPhoneNumber(), true, user.getPhoneVerifiedAt());
            }
            throw alreadyVerified();
        }

        ensureAvailableForUser(phoneNumber, userId);
        Instant now = Instant.now();
        PhoneVerificationChallenge challenge = challengeRepository.findByUserIdForUpdate(userId).orElse(null);
        if (challenge != null && challenge.getResendAvailableAt().isAfter(now)) {
            throw new BusinessException(
                    MessageCodes.PHONE_VERIFICATION_RATE_LIMITED,
                    "Please wait before requesting another verification code",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        String nonce = securityService.newOtpNonce();
        if (challenge == null) {
            challenge = PhoneVerificationChallenge.builder()
                    .userId(userId)
                    .createdAt(now)
                    .build();
        }
        challenge.setPhoneNumber(phoneNumber);
        challenge.setNonce(nonce);
        challenge.setCodeHash(securityService.hashOtp(userId, nonce, code));
        challenge.setExpiresAt(now.plus(OTP_LIFETIME));
        challenge.setResendAvailableAt(now.plus(RESEND_COOLDOWN));
        challenge.setFailedAttempts(0);
        challenge.setUpdatedAt(now);
        challengeRepository.saveAndFlush(challenge);

        smsSender.send(phoneNumber, "Ma xac thuc ManabiHub cua ban la " + code + ". Ma co hieu luc trong 5 phut.");
        return new PhoneVerificationResponse(phoneNumber, false, null);
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = BusinessException.class
    )
    public PhoneVerificationResponse confirmCode(UUID userId, String requestedPhoneNumber, String code) {
        AppUser user = findUserForUpdate(userId);
        String phoneNumber = normalizeAndValidate(requestedPhoneNumber);
        if (user.getPhoneVerifiedAt() != null) {
            if (Objects.equals(user.getPhoneNumber(), phoneNumber)) {
                return new PhoneVerificationResponse(user.getPhoneNumber(), true, user.getPhoneVerifiedAt());
            }
            throw alreadyVerified();
        }

        PhoneVerificationChallenge challenge = challengeRepository.findByUserIdForUpdate(userId)
                .orElseThrow(this::invalidCode);
        Instant now = Instant.now();
        if (!Objects.equals(challenge.getPhoneNumber(), phoneNumber)
                || !challenge.getExpiresAt().isAfter(now)
                || challenge.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            if (!challenge.getExpiresAt().isAfter(now)) {
                challengeRepository.delete(challenge);
            }
            throw invalidCode();
        }

        if (!securityService.otpMatches(userId, challenge.getNonce(), code, challenge.getCodeHash())) {
            challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
            challenge.setUpdatedAt(now);
            challengeRepository.save(challenge);
            throw invalidCode();
        }

        ensureAvailableForUser(phoneNumber, userId);
        user.setPhoneNumber(phoneNumber);
        user.setPhoneVerifiedAt(now);
        appUserRepository.saveAndFlush(user);
        challengeRepository.delete(challenge);
        return new PhoneVerificationResponse(phoneNumber, true, now);
    }

    private AppUser findUserForUpdate(UUID userId) {
        return appUserRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
    }

    private String normalizeAndValidate(String phoneNumber) {
        String normalized = PhoneNumberNormalizer.normalize(phoneNumber);
        if (normalized == null || !normalized.matches("0\\d{9}")) {
            throw new BusinessException(MessageCodes.MSG_PRO_002, "Phone number is invalid");
        }
        return normalized;
    }

    private void ensureAvailableForUser(String phoneNumber, UUID userId) {
        appUserRepository.findByPhoneNumber(phoneNumber)
                .filter(existing -> !Objects.equals(existing.getId(), userId))
                .ifPresent(existing -> {
                    throw new BusinessException(
                            MessageCodes.PHONE_VERIFICATION_ALREADY_IN_USE,
                            "This phone number is already used by another account",
                            HttpStatus.CONFLICT
                    );
                });
    }

    private BusinessException alreadyVerified() {
        return new BusinessException(
                MessageCodes.PHONE_VERIFICATION_ALREADY_VERIFIED,
                "A verified phone number cannot be changed",
                HttpStatus.CONFLICT
        );
    }

    private BusinessException invalidCode() {
        return new BusinessException(MessageCodes.PHONE_VERIFICATION_INVALID_OTP, "Invalid or expired verification code");
    }
}
