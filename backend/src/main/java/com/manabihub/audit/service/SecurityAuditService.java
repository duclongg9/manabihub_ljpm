package com.manabihub.audit.service;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class SecurityAuditService {

    private final AuditLogRepository auditLogRepository;

    public SecurityAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Logs security event when duplicate identity attempt is detected.
     * Uses REQUIRES_NEW propagation to ensure audit log is saved even if outer transaction rolls back.
     * CRITICAL: Absolutely no raw CCCD or identity fingerprint in the audit log payload.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDuplicateIdentityAudit(UUID teacherId, UUID actorUserId, String ipAddress, String userAgent) {
        AuditLog auditLog = AuditLog.builder()
                .actorType("USER")
                .actorUserId(actorUserId)
                .actorRoleCode("TEACHER")
                .action("KYC_DUPLICATE_IDENTITY_DETECTED")
                .targetType("TEACHER_PROFILE")
                .targetId(teacherId)
                .afterValue(Map.of(
                        "reason", "Duplicate CCCD identity claim detected across different teachers",
                        "status", "BLOCKED"
                ))
                .metadata(Map.of(
                        "uc", "UC-22",
                        "module", "IDENTITY_VERIFICATION",
                        "msg", MessageCodes.MSG_KYC_008
                ))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(auditLog);
    }

    /**
     * Logs security audit when historical duplicate identity claims are quarantined during backfill.
     * REQUIRES_NEW transaction ensures log persistence. No PII is logged.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logBackfillQuarantineAudit(UUID teacherId, int conflictingTeacherCount) {
        AuditLog auditLog = AuditLog.builder()
                .actorType("SYSTEM")
                .actorRoleCode("SYSTEM")
                .action("KYC_BACKFILL_DUPLICATE_QUARANTINED")
                .targetType("TEACHER_PROFILE")
                .targetId(teacherId)
                .afterValue(Map.of(
                        "reason", "Historical duplicate identity claim quarantined during startup backfill",
                        "conflictingTeachers", conflictingTeacherCount,
                        "resolutionRequired", "MANUAL_ADMIN_RESOLUTION_REQUIRED"
                ))
                .metadata(Map.of(
                        "uc", "UC-22",
                        "module", "HISTORICAL_BACKFILL"
                ))
                .build();

        auditLogRepository.save(auditLog);
    }
}
