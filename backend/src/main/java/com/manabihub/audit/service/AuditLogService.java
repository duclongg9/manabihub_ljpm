package com.manabihub.audit.service;

import java.util.Map;
import java.util.UUID;

public interface AuditLogService {

    void logUserAction(
            UUID userId,
            String roleCode,
            String action,
            String targetType,
            UUID targetId,
            Map<String, Object> beforeValue,
            Map<String, Object> afterValue,
            Map<String, Object> metadata
    );
}