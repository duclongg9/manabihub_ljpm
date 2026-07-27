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
import com.manabihub.systemconfig.dto.response.InternalAdminAccountResponse;
import com.manabihub.systemconfig.dto.response.SystemSettingResponse;
import com.manabihub.systemconfig.entity.SystemSetting;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.systemconfig.service.SystemAdministrationService;
import com.manabihub.systemconfig.service.SystemSettingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SystemAdministrationServiceImpl implements SystemAdministrationService {

    private static final List<RoleCode> INTERNAL_ROLES = List.of(
            RoleCode.SYSTEM_ADMIN,
            RoleCode.COURSE_MANAGER,
            RoleCode.FINANCE_MANAGER
    );

    private final SystemSettingRepository settingRepository;
    private final InternalAdminAccountRepository adminRepository;
    private final RoleRepository roleRepository;
    private final AuditLogService auditLogService;
    private final SystemSettingValidator validator;

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingResponse> listSettings(UUID actorId) {
        requireLiveSystemAdmin(actorId);
        return settingRepository
                .findAllBySettingKeyInOrderBySettingKeyAsc(SystemSettingValidator.SUPPORTED_KEYS)
                .stream()
                .map(this::toSettingResponse)
                .toList();
    }

    @Override
    @Transactional
    public SystemSettingResponse updateSetting(
            UUID actorId,
            String settingKey,
            String value,
            String reason
    ) {
        InternalAdminAccount actor = requireLiveSystemAdmin(actorId);
        String key = settingKey == null ? "" : settingKey.trim().toUpperCase();
        SystemSetting setting = settingRepository.findBySettingKeyForUpdate(key)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "System setting not found",
                        HttpStatus.NOT_FOUND
                ));

        if (!setting.isEditable()) {
            throw new BusinessException(
                    MessageCodes.SYSTEM_SETTING_NOT_EDITABLE,
                    "This system setting is read-only",
                    HttpStatus.CONFLICT
            );
        }

        String normalizedValue = validator.normalize(key, value);
        String previousValue = setting.getSettingValue();
        if (previousValue.equals(normalizedValue)) {
            return toSettingResponse(setting);
        }

        setting.setSettingValue(normalizedValue);
        setting.setUpdatedBy(actorId);
        SystemSetting saved = settingRepository.save(setting);

        auditLogService.logAdminAction(
                actorId,
                actor.getRole().getCode().name(),
                "UPDATE_SYSTEM_SETTING",
                "SYSTEM_SETTING",
                saved.getId(),
                Map.of("settingKey", key, "value", previousValue),
                Map.of("settingKey", key, "value", normalizedValue),
                Map.of("reason", reason.trim())
        );
        return toSettingResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InternalAdminAccountResponse> listInternalAdmins(UUID actorId) {
        requireLiveSystemAdmin(actorId);
        return adminRepository.findAllByOrderByFullNameAsc()
                .stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Override
    @Transactional
    public InternalAdminAccountResponse updateInternalAdminRole(
            UUID actorId,
            UUID targetAdminId,
            RoleCode roleCode,
            String reason
    ) {
        InternalAdminAccount actor = requireLiveSystemAdmin(actorId);

        if (actorId.equals(targetAdminId)) {
            throw new BusinessException(
                    MessageCodes.INTERNAL_ROLE_SELF_ASSIGNMENT_FORBIDDEN,
                    "Use another active System Admin to change your own role",
                    HttpStatus.CONFLICT
            );
        }
        if (!INTERNAL_ROLES.contains(roleCode)) {
            throw new BusinessException(
                    MessageCodes.INTERNAL_ROLE_INVALID,
                    "Only internal administrator roles can be assigned"
            );
        }

        // Serialize role assignments against the active System Admin set so two
        // concurrent demotions cannot both observe "another admin" and leave
        // the platform with zero System Admins.
        List<InternalAdminAccount> activeSystemAdmins =
                adminRepository.findAllByStatusAndRoleCodeForUpdate(
                        AccountStatus.ACTIVE,
                        RoleCode.SYSTEM_ADMIN
                );

        InternalAdminAccount target = adminRepository.findByIdForRoleUpdate(targetAdminId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Internal administrator account not found",
                        HttpStatus.NOT_FOUND
                ));
        if (target.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BusinessException(
                    MessageCodes.INTERNAL_ROLE_INVALID,
                    "Only active administrator accounts can be assigned a role",
                    HttpStatus.CONFLICT
            );
        }

        RoleCode previousRole = target.getRole().getCode();
        if (previousRole == roleCode) {
            return toAdminResponse(target);
        }

        if (previousRole == RoleCode.SYSTEM_ADMIN && activeSystemAdmins.size() <= 1) {
            throw new BusinessException(
                    MessageCodes.LAST_SYSTEM_ADMIN_REQUIRED,
                    "At least one active System Admin must remain",
                    HttpStatus.CONFLICT
            );
        }

        Role newRole = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.INTERNAL_ROLE_INVALID,
                        "Internal role is not configured"
                ));

        target.setRole(newRole);
        InternalAdminAccount saved = adminRepository.save(target);

        auditLogService.logAdminAction(
                actorId,
                actor.getRole().getCode().name(),
                "ASSIGN_INTERNAL_ROLE",
                "INTERNAL_ADMIN_ACCOUNT",
                targetAdminId,
                Map.of("role", previousRole.name()),
                Map.of("role", roleCode.name()),
                Map.of(
                        "reason", reason.trim(),
                        "targetEmail", target.getEmail(),
                        "requiresReauthentication", true
                )
        );
        return toAdminResponse(saved);
    }

    private InternalAdminAccount requireLiveSystemAdmin(UUID actorId) {
        InternalAdminAccount actor = adminRepository.findById(actorId)
                .orElseThrow(() -> permissionDenied("Administrator account was not found"));
        if (actor.getAccountStatus() != AccountStatus.ACTIVE
                || actor.getRole() == null
                || actor.getRole().getCode() != RoleCode.SYSTEM_ADMIN) {
            throw permissionDenied("A live System Admin role is required");
        }
        return actor;
    }

    private BusinessException permissionDenied(String message) {
        return new BusinessException(
                MessageCodes.SYSTEM_ADMIN_REQUIRED,
                message,
                HttpStatus.FORBIDDEN
        );
    }

    private SystemSettingResponse toSettingResponse(SystemSetting setting) {
        return new SystemSettingResponse(
                setting.getId(),
                setting.getSettingKey(),
                setting.getSettingValue(),
                setting.getValueType(),
                setting.getDescription(),
                setting.isEditable(),
                setting.getUpdatedBy(),
                setting.getUpdatedAt()
        );
    }

    private InternalAdminAccountResponse toAdminResponse(InternalAdminAccount account) {
        return new InternalAdminAccountResponse(
                account.getId(),
                account.getEmail(),
                account.getFullName(),
                account.getAccountStatus(),
                account.getRole().getCode(),
                account.getLastLoginAt(),
                account.getUpdatedAt()
        );
    }
}
