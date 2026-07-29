package com.manabihub.systemconfig.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.entity.Role;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.enums.RoleCode;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.repository.RoleRepository;
import com.manabihub.identity.service.InternalAdminInvitationService;
import com.manabihub.systemconfig.entity.SystemSetting;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import com.manabihub.systemconfig.service.SystemSettingValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemAdministrationServiceImplTest {

    @Mock private SystemSettingRepository settingRepository;
    @Mock private InternalAdminAccountRepository adminRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private InternalAdminInvitationService invitationService;

    private SystemAdministrationServiceImpl service;
    private UUID actorId;
    private InternalAdminAccount actor;

    @BeforeEach
    void setUp() {
        service = new SystemAdministrationServiceImpl(
                settingRepository,
                adminRepository,
                roleRepository,
                auditLogService,
                new SystemSettingValidator(),
                new CommercialPolicyService(settingRepository),
                invitationService
        );
        actorId = UUID.randomUUID();
        actor = account(actorId, "system@manabihub.local", RoleCode.SYSTEM_ADMIN);
        when(adminRepository.findById(actorId)).thenReturn(Optional.of(actor));
        org.mockito.Mockito.lenient()
                .when(invitationService.latestInvitationSummaries(any()))
                .thenReturn(Map.of());
        org.mockito.Mockito.lenient()
                .when(adminRepository.findAllByStatusAndRoleCodeForUpdate(
                        AccountStatus.ACTIVE,
                        RoleCode.SYSTEM_ADMIN
                ))
                .thenReturn(java.util.List.of(actor));
    }

    @Test
    void updateSettingNormalizesAndAuditsBeforeAfter() {
        SystemSetting setting = SystemSetting.builder()
                .id(UUID.randomUUID())
                .settingKey("COMMISSION_RATE")
                .settingValue("0.20")
                .valueType("NUMBER")
                .editable(true)
                .build();
        when(settingRepository.findAllBySettingKeyInForUpdate(any()))
                .thenReturn(List.of(setting));
        when(settingRepository.save(setting)).thenReturn(setting);

        var response = service.updateSetting(
                actorId,
                "commission_rate",
                "0.2500",
                "Approved platform pricing change"
        );

        assertEquals("0.25", response.value());
        assertEquals(actorId, setting.getUpdatedBy());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> before = ArgumentCaptor.forClass(Map.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> after = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).logAdminAction(
                eq(actorId),
                eq("SYSTEM_ADMIN"),
                eq("UPDATE_SYSTEM_SETTING"),
                eq("SYSTEM_SETTING"),
                eq(setting.getId()),
                before.capture(),
                after.capture(),
                any()
        );
        assertEquals("0.20", before.getValue().get("value"));
        assertEquals("0.25", after.getValue().get("value"));
    }

    @Test
    void invalidSettingIsRejectedWithoutWriteOrAudit() {
        SystemSetting setting = SystemSetting.builder()
                .id(UUID.randomUUID())
                .settingKey("COMMISSION_RATE")
                .settingValue("0.20")
                .valueType("NUMBER")
                .editable(true)
                .build();
        when(settingRepository.findAllBySettingKeyInForUpdate(any()))
                .thenReturn(List.of(setting));

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.updateSetting(actorId, "COMMISSION_RATE", "5", "bad")
        );

        assertEquals(MessageCodes.SYSTEM_SETTING_INVALID, error.getMessageCode());
        verify(settingRepository, never()).save(any());
        verify(auditLogService, never()).logAdminAction(
                any(), any(), any(), any(), any(), any(), any(), any()
        );
    }

    @Test
    void roleAssignmentChangesOnlyTargetAndCreatesAudit() {
        UUID targetId = UUID.randomUUID();
        InternalAdminAccount target = account(
                targetId,
                "course@manabihub.local",
                RoleCode.COURSE_MANAGER
        );
        Role financeRole = role(RoleCode.FINANCE_MANAGER);
        when(adminRepository.findByIdForRoleUpdate(targetId)).thenReturn(Optional.of(target));
        when(roleRepository.findByCode(RoleCode.FINANCE_MANAGER))
                .thenReturn(Optional.of(financeRole));
        when(adminRepository.save(target)).thenReturn(target);

        var response = service.updateInternalAdminRole(
                actorId,
                targetId,
                RoleCode.FINANCE_MANAGER,
                "Move ownership to finance"
        );

        assertEquals(RoleCode.FINANCE_MANAGER, response.role());
        verify(auditLogService).logAdminAction(
                eq(actorId),
                eq("SYSTEM_ADMIN"),
                eq("ASSIGN_INTERNAL_ROLE"),
                eq("INTERNAL_ADMIN_ACCOUNT"),
                eq(targetId),
                eq(Map.of("role", "COURSE_MANAGER")),
                eq(Map.of("role", "FINANCE_MANAGER")),
                any()
        );
    }

    @Test
    void systemAdminCannotChangeOwnRole() {
        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.updateInternalAdminRole(
                        actorId,
                        actorId,
                        RoleCode.COURSE_MANAGER,
                        "self change"
                )
        );
        assertEquals(
                MessageCodes.INTERNAL_ROLE_SELF_ASSIGNMENT_FORBIDDEN,
                error.getMessageCode()
        );
        verify(adminRepository, never()).findByIdForRoleUpdate(any());
    }

    @Test
    void databaseRoleIsAuthoritativeEvenWhenJwtLayerWasStale() {
        actor.setRole(role(RoleCode.COURSE_MANAGER));

        BusinessException error = assertThrows(
                BusinessException.class,
                () -> service.listInternalAdmins(actorId)
        );

        assertEquals(MessageCodes.SYSTEM_ADMIN_REQUIRED, error.getMessageCode());
        assertEquals(403, error.getHttpStatus().value());
    }

    private InternalAdminAccount account(UUID id, String email, RoleCode roleCode) {
        InternalAdminAccount account = new InternalAdminAccount();
        account.setId(id);
        account.setEmail(email);
        account.setFullName(email);
        account.setPasswordHash("not-returned");
        account.setAccountStatus(AccountStatus.ACTIVE);
        account.setRole(role(roleCode));
        return account;
    }

    private Role role(RoleCode code) {
        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setCode(code);
        role.setName(code.name());
        return role;
    }
}
