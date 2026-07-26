package com.manabihub.audit.service.impl;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void logUserAction(
            UUID userId,
            String roleCode,
            String action,
            String targetType,
            UUID targetId,
            Map<String, Object> beforeValue,
            Map<String, Object> afterValue,
            Map<String, Object> metadata
    ) {

        AuditLog auditLog = AuditLog.builder()
                .actorType("USER")
                .actorUserId(userId)
                .actorRoleCode(roleCode)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .beforeValue(beforeValue)
                .afterValue(afterValue)
                .metadata(metadata)
                .build();

        auditLogRepository.save(auditLog);
    }

    @Override
    public void logAdminAction(
            UUID adminId,
            String roleCode,
            String action,
            String targetType,
            UUID targetId,
            Map<String, Object> beforeValue,
            Map<String, Object> afterValue,
            Map<String, Object> metadata
    ) {
        AuditLog auditLog = AuditLog.builder()
                .actorType("INTERNAL_ADMIN")
                .actorAdminId(adminId)
                .actorRoleCode(roleCode)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .beforeValue(beforeValue)
                .afterValue(afterValue)
                .metadata(metadata)
                .build();

        auditLogRepository.save(auditLog);
    }
}
