package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.KycRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface KycRequestRepository extends JpaRepository<KycRequest, UUID> {

    Optional<KycRequest> findTopByTeacherProfileIdOrderBySubmittedAtDesc(UUID teacherId);
}
