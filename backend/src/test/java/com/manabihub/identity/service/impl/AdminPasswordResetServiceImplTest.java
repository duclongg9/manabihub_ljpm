package com.manabihub.identity.service.impl;

import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.entity.InternalAdminPasswordReset;
import com.manabihub.identity.entity.Role;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.enums.RoleCode;
import com.manabihub.identity.event.InternalAdminPasswordChangedEvent;
import com.manabihub.identity.event.InternalAdminPasswordResetIssuedEvent;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.repository.InternalAdminPasswordResetRepository;
import com.manabihub.identity.repository.InternalAdminSessionRepository;
import com.manabihub.identity.service.AdminLoginProtection;
import com.manabihub.identity.service.AdminPasswordResetRequestLimiter;
import com.manabihub.identity.service.InternalAdminPasswordPolicy;
import com.manabihub.identity.service.SecureTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPasswordResetServiceImplTest {

    @Mock private InternalAdminAccountRepository accountRepository;
    @Mock private InternalAdminPasswordResetRepository passwordResetRepository;
    @Mock private InternalAdminSessionRepository sessionRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private InternalAdminPasswordPolicy passwordPolicy;
    @Mock private SecureTokenService tokenService;
    @Mock private AdminPasswordResetRequestLimiter requestLimiter;
    @Mock private AdminLoginProtection loginProtection;
    @Mock private ApplicationEventPublisher eventPublisher;

    private AdminPasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminPasswordResetServiceImpl(
                accountRepository,
                passwordResetRepository,
                sessionRepository,
                auditLogRepository,
                passwordEncoder,
                passwordPolicy,
                tokenService,
                requestLimiter,
                loginProtection,
                eventPublisher
        );
        ReflectionTestUtils.setField(service, "resetTtlMinutes", 30L);
        ReflectionTestUtils.setField(service, "resetCooldownSeconds", 60L);
    }

    @Test
    void unknownEmailReturnsSilentlyWithoutPublishingAReset() {
        when(requestLimiter.allow("unknown@example.com", "127.0.0.1"))
                .thenReturn(true);
        when(accountRepository.findByEmail("unknown@example.com"))
                .thenReturn(Optional.empty());

        service.request("unknown@example.com", "127.0.0.1", "JUnit");

        verifyNoInteractions(passwordResetRepository, eventPublisher);
    }

    @Test
    void requestStoresOnlyHashAndLeavesCurrentPasswordAndSessionsUntouched() {
        InternalAdminAccount account = account();
        when(requestLimiter.allow(account.getEmail(), "127.0.0.1"))
                .thenReturn(true);
        when(accountRepository.findByEmail(account.getEmail()))
                .thenReturn(Optional.of(account));
        when(passwordResetRepository.findOpenForAccount(account.getId()))
                .thenReturn(Optional.empty());
        when(tokenService.randomToken()).thenReturn("raw-reset-token");
        when(tokenService.hash("raw-reset-token")).thenReturn("reset-hash");

        service.request(account.getEmail(), "127.0.0.1", "JUnit");

        verify(passwordResetRepository).saveAndFlush(argThat(reset ->
                reset.getAdminAccountId().equals(account.getId())
                        && "reset-hash".equals(reset.getTokenHash())
                        && reset.getExpiresAt().isAfter(Instant.now())
        ));
        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        InternalAdminPasswordResetIssuedEvent issued = assertInstanceOf(
                InternalAdminPasswordResetIssuedEvent.class,
                eventCaptor.getValue()
        );
        assertEquals("raw-reset-token", issued.rawToken());
        assertEquals(account.getId(), issued.adminAccountId());
        verify(sessionRepository, never()).revokeAllForAccount(any(), any());
        assertEquals("old-password-hash", account.getPasswordHash());
    }

    @Test
    void successfulResetChangesPasswordAndRevokesEverySession() {
        InternalAdminAccount account = account();
        InternalAdminPasswordReset reset = new InternalAdminPasswordReset();
        reset.setAdminAccountId(account.getId());
        reset.setTokenHash("reset-hash");
        reset.setExpiresAt(Instant.now().plusSeconds(600));
        when(tokenService.hash("raw-reset-token")).thenReturn("reset-hash");
        when(passwordResetRepository.findByTokenHashForUpdate("reset-hash"))
                .thenReturn(Optional.of(reset));
        when(accountRepository.findByIdForRoleUpdate(account.getId()))
                .thenReturn(Optional.of(account));
        when(passwordEncoder.matches("NewPassword!42", "old-password-hash"))
                .thenReturn(false);
        when(passwordEncoder.encode("NewPassword!42"))
                .thenReturn("new-password-hash");

        service.reset(
                "raw-reset-token",
                "NewPassword!42",
                "127.0.0.1",
                "JUnit"
        );

        assertEquals("new-password-hash", account.getPasswordHash());
        assertEquals(3, account.getCredentialVersion());
        assertNotNull(reset.getUsedAt());
        verify(sessionRepository).revokeAllForAccount(eq(account.getId()), any());
        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        InternalAdminPasswordChangedEvent changed = assertInstanceOf(
                InternalAdminPasswordChangedEvent.class,
                eventCaptor.getValue()
        );
        assertEquals(account.getId(), changed.adminAccountId());
    }

    @Test
    void usedResetTokenCannotBeReplayed() {
        InternalAdminPasswordReset reset = new InternalAdminPasswordReset();
        reset.setUsedAt(Instant.now());
        reset.setExpiresAt(Instant.now().plusSeconds(600));
        when(tokenService.hash("used-token")).thenReturn("used-hash");
        when(passwordResetRepository.findByTokenHashForUpdate("used-hash"))
                .thenReturn(Optional.of(reset));

        assertThrows(
                BusinessException.class,
                () -> service.reset(
                        "used-token",
                        "NewPassword!42",
                        "127.0.0.1",
                        "JUnit"
                )
        );

        verifyNoInteractions(accountRepository, sessionRepository);
    }

    private InternalAdminAccount account() {
        Role role = new Role();
        role.setCode(RoleCode.FINANCE_MANAGER);
        InternalAdminAccount account = new InternalAdminAccount();
        account.setId(UUID.randomUUID());
        account.setEmail("finance@example.com");
        account.setFullName("Finance Manager");
        account.setPasswordHash("old-password-hash");
        account.setAccountStatus(AccountStatus.ACTIVE);
        account.setCredentialVersion(2);
        account.setRole(role);
        return account;
    }
}
