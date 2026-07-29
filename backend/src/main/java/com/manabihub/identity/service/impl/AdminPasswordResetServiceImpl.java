package com.manabihub.identity.service.impl;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.entity.InternalAdminPasswordReset;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.event.InternalAdminPasswordChangedEvent;
import com.manabihub.identity.event.InternalAdminPasswordResetIssuedEvent;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.repository.InternalAdminPasswordResetRepository;
import com.manabihub.identity.repository.InternalAdminSessionRepository;
import com.manabihub.identity.service.AdminLoginProtection;
import com.manabihub.identity.service.AdminPasswordResetRequestLimiter;
import com.manabihub.identity.service.AdminPasswordResetService;
import com.manabihub.identity.service.InternalAdminPasswordPolicy;
import com.manabihub.identity.service.SecureTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminPasswordResetServiceImpl implements AdminPasswordResetService {

    private final InternalAdminAccountRepository accountRepository;
    private final InternalAdminPasswordResetRepository passwordResetRepository;
    private final InternalAdminSessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final InternalAdminPasswordPolicy passwordPolicy;
    private final SecureTokenService tokenService;
    private final AdminPasswordResetRequestLimiter requestLimiter;
    private final AdminLoginProtection loginProtection;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${manabihub.admin-auth.password-reset-minutes:30}")
    private long resetTtlMinutes;

    @Value("${manabihub.admin-auth.password-reset-cooldown-seconds:60}")
    private long resetCooldownSeconds;

    @Override
    @Transactional
    public void request(String email, String ipAddress, String userAgent) {
        String normalizedEmail = email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);
        if (!requestLimiter.allow(normalizedEmail, ipAddress)) {
            return;
        }

        InternalAdminAccount account = accountRepository.findByEmail(normalizedEmail)
                .filter(candidate -> candidate.getAccountStatus() == AccountStatus.ACTIVE)
                .orElse(null);
        if (account == null) {
            return;
        }

        Instant now = Instant.now();
        InternalAdminPasswordReset openReset = passwordResetRepository
                .findOpenForAccount(account.getId())
                .orElse(null);
        if (openReset != null
                && openReset.getCreatedAt() != null
                && Duration.between(openReset.getCreatedAt(), now).toSeconds()
                        < resetCooldownSeconds) {
            return;
        }

        passwordResetRepository.revokeOpenForAccount(account.getId(), now);
        String rawToken = tokenService.randomToken();
        InternalAdminPasswordReset passwordReset = new InternalAdminPasswordReset();
        passwordReset.setAdminAccountId(account.getId());
        passwordReset.setTokenHash(tokenService.hash(rawToken));
        passwordReset.setExpiresAt(now.plus(resetTtlMinutes, ChronoUnit.MINUTES));
        passwordResetRepository.saveAndFlush(passwordReset);

        auditLogRepository.save(AuditLog.builder()
                .actorType("SYSTEM")
                .action("ADMIN_PASSWORD_RESET_REQUESTED")
                .targetType("INTERNAL_ADMIN_ACCOUNT")
                .targetId(account.getId())
                .metadata(Map.of("delivery", "EMAIL"))
                .ipAddress(safeMetadata(ipAddress))
                .userAgent(safeMetadata(userAgent))
                .build());
        eventPublisher.publishEvent(new InternalAdminPasswordResetIssuedEvent(
                account.getId(),
                account.getEmail(),
                account.getFullName(),
                rawToken,
                passwordReset.getExpiresAt()
        ));
    }

    @Override
    @Transactional
    public void reset(
            String rawToken,
            String newPassword,
            String ipAddress,
            String userAgent
    ) {
        passwordPolicy.validate(newPassword);
        InternalAdminPasswordReset passwordReset = passwordResetRepository
                .findByTokenHashForUpdate(safeHash(rawToken))
                .orElseThrow(this::invalidReset);
        Instant now = Instant.now();
        if (passwordReset.getUsedAt() != null
                || passwordReset.getRevokedAt() != null
                || !now.isBefore(passwordReset.getExpiresAt())) {
            throw invalidReset();
        }

        InternalAdminAccount account = accountRepository
                .findByIdForRoleUpdate(passwordReset.getAdminAccountId())
                .orElseThrow(this::invalidReset);
        if (account.getAccountStatus() != AccountStatus.ACTIVE) {
            throw invalidReset();
        }
        rejectPasswordReuse(account, newPassword);

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setCredentialVersion(account.getCredentialVersion() + 1);
        accountRepository.save(account);
        passwordReset.setUsedAt(now);
        passwordResetRepository.save(passwordReset);
        passwordResetRepository.revokeOpenForAccount(account.getId(), now);
        sessionRepository.revokeAllForAccount(account.getId(), now);
        loginProtection.reset(
                account.getEmail().toLowerCase(Locale.ROOT),
                ipAddress
        );

        recordPasswordChange(
                account,
                "ADMIN_PASSWORD_RESET_COMPLETED",
                ipAddress,
                userAgent
        );
        eventPublisher.publishEvent(new InternalAdminPasswordChangedEvent(
                account.getId(),
                account.getEmail(),
                account.getFullName(),
                now
        ));
    }

    @Override
    @Transactional
    public void change(
            UUID adminId,
            String currentPassword,
            String newPassword,
            String ipAddress,
            String userAgent
    ) {
        passwordPolicy.validate(newPassword);
        InternalAdminAccount account = accountRepository
                .findByIdForRoleUpdate(adminId)
                .orElseThrow(this::invalidCurrentPassword);
        if (account.getAccountStatus() != AccountStatus.ACTIVE
                || !passwordEncoder.matches(currentPassword, account.getPasswordHash())) {
            throw invalidCurrentPassword();
        }
        rejectPasswordReuse(account, newPassword);

        Instant now = Instant.now();
        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setCredentialVersion(account.getCredentialVersion() + 1);
        accountRepository.save(account);
        passwordResetRepository.revokeOpenForAccount(account.getId(), now);
        sessionRepository.revokeAllForAccount(account.getId(), now);
        loginProtection.reset(
                account.getEmail().toLowerCase(Locale.ROOT),
                ipAddress
        );
        recordPasswordChange(
                account,
                "ADMIN_PASSWORD_CHANGED",
                ipAddress,
                userAgent
        );
        eventPublisher.publishEvent(new InternalAdminPasswordChangedEvent(
                account.getId(),
                account.getEmail(),
                account.getFullName(),
                now
        ));
    }

    private void rejectPasswordReuse(
            InternalAdminAccount account,
            String newPassword
    ) {
        if (passwordEncoder.matches(newPassword, account.getPasswordHash())) {
            throw new BusinessException(
                    MessageCodes.ADMIN_PASSWORD_REUSE_FORBIDDEN,
                    "New password must differ from the current password"
            );
        }
    }

    private void recordPasswordChange(
            InternalAdminAccount account,
            String action,
            String ipAddress,
            String userAgent
    ) {
        auditLogRepository.save(AuditLog.builder()
                .actorType("INTERNAL_ADMIN")
                .actorAdminId(account.getId())
                .actorRoleCode(account.getRole().getCode().name())
                .action(action)
                .targetType("INTERNAL_ADMIN_ACCOUNT")
                .targetId(account.getId())
                .metadata(Map.of("sessionsRevoked", true))
                .ipAddress(safeMetadata(ipAddress))
                .userAgent(safeMetadata(userAgent))
                .build());
    }

    private String safeHash(String rawToken) {
        try {
            return tokenService.hash(rawToken);
        } catch (IllegalArgumentException exception) {
            throw invalidReset();
        }
    }

    private BusinessException invalidReset() {
        return new BusinessException(
                MessageCodes.ADMIN_PASSWORD_RESET_INVALID,
                "The password reset link is invalid or expired",
                HttpStatus.BAD_REQUEST
        );
    }

    private BusinessException invalidCurrentPassword() {
        return new BusinessException(
                MessageCodes.ADMIN_CURRENT_PASSWORD_INVALID,
                "Current password is invalid",
                HttpStatus.BAD_REQUEST
        );
    }

    private String safeMetadata(String value) {
        return value == null ? "" : value.substring(0, Math.min(value.length(), 500));
    }
}
