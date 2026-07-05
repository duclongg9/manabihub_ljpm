package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository("kycAuditLogRepository")
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
}
