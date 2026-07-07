package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.KycRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KycRequestRepository extends JpaRepository<KycRequest, UUID> {
    List<KycRequest> findByStatusOrderByCreatedAtDesc(KycRequestStatus status);
    Optional<KycRequest> findTopByTeacherProfileIdOrderBySubmittedAtDesc(UUID teacherId);
}
