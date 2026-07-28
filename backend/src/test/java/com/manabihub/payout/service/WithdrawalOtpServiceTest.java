package com.manabihub.payout.service;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.mail.EmailService;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.payout.entity.WithdrawalOtpChallenge;
import com.manabihub.payout.repository.WithdrawalOtpChallengeRepository;
import com.manabihub.payout.security.PayoutSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WithdrawalOtpServiceTest {

    @Mock private WithdrawalOtpChallengeRepository challengeRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private EmailService emailService;

    private PayoutSecurityService securityService;
    private WithdrawalOtpService service;
    private UUID userId;
    private AppUser user;

    @BeforeEach
    void setUp() {
        securityService = new PayoutSecurityService(
                "test-only-payout-secret-key-32chars-minimum-length"
        );
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                securityService,
                "initialize"
        );
        service = new WithdrawalOtpService(
                challengeRepository,
                appUserRepository,
                emailService,
                securityService
        );
        userId = UUID.randomUUID();
        user = AppUser.builder()
                .id(userId)
                .email("teacher@example.com")
                .fullName("Teacher")
                .build();
    }

    @Test
    void sendOtp_PersistsOnlyHashAndAppliesCooldown() {
        when(appUserRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
        when(challengeRepository.findById(userId)).thenReturn(Optional.empty());

        service.sendOtp(userId.toString());

        ArgumentCaptor<WithdrawalOtpChallenge> challengeCaptor =
                ArgumentCaptor.forClass(WithdrawalOtpChallenge.class);
        verify(challengeRepository).saveAndFlush(challengeCaptor.capture());
        WithdrawalOtpChallenge challenge = challengeCaptor.getValue();
        assertEquals(userId, challenge.getUserId());
        assertTrue(challenge.getExpiresAt().isAfter(Instant.now()));
        assertTrue(challenge.getResendAvailableAt().isAfter(Instant.now()));

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendEmail(
                org.mockito.ArgumentMatchers.eq("teacher@example.com"),
                any(),
                bodyCaptor.capture()
        );
        Matcher matcher = Pattern.compile(">(\\d{6})</h2>").matcher(bodyCaptor.getValue());
        assertTrue(matcher.find());
        String plaintextCode = matcher.group(1);
        assertNotEquals(plaintextCode, challenge.getCodeHash());
        assertTrue(securityService.otpMatches(
                userId,
                challenge.getNonce(),
                plaintextCode,
                challenge.getCodeHash()
        ));
    }

    @Test
    void sendOtp_BeforeCooldownExpires_IsRejectedWithoutEmail() {
        WithdrawalOtpChallenge existing = challenge("123456");
        existing.setResendAvailableAt(Instant.now().plusSeconds(30));
        when(appUserRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
        when(challengeRepository.findById(userId)).thenReturn(Optional.of(existing));

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.sendOtp(userId.toString())
        );

        assertEquals("PAYOUT_OTP_RATE_LIMITED", error.getMessageCode());
        verifyNoInteractions(emailService);
    }

    @Test
    void consumeOtp_DeletesChallengeAfterOneSuccessfulUse() {
        WithdrawalOtpChallenge challenge = challenge("123456");
        when(challengeRepository.findByUserIdForUpdate(userId))
                .thenReturn(Optional.of(challenge));

        service.consumeOtp(userId.toString(), "123456");

        verify(challengeRepository).delete(challenge);
        verify(challengeRepository, never()).save(any());
    }

    @Test
    void consumeOtp_InvalidCodePersistsFailedAttempt() {
        WithdrawalOtpChallenge challenge = challenge("123456");
        when(challengeRepository.findByUserIdForUpdate(userId))
                .thenReturn(Optional.of(challenge));

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.consumeOtp(userId.toString(), "654321")
        );

        assertEquals("PAYOUT_INVALID_OTP", error.getMessageCode());
        assertEquals(1, challenge.getFailedAttempts());
        verify(challengeRepository).save(challenge);
        verify(challengeRepository, never()).delete(any());
    }

    private WithdrawalOtpChallenge challenge(String code) {
        Instant now = Instant.now();
        String nonce = securityService.newOtpNonce();
        return WithdrawalOtpChallenge.builder()
                .userId(userId)
                .nonce(nonce)
                .codeHash(securityService.hashOtp(userId, nonce, code))
                .expiresAt(now.plusSeconds(300))
                .resendAvailableAt(now)
                .failedAttempts(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
