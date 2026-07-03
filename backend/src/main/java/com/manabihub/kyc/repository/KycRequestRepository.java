package com.manabihub.kyc.repository;

import com.manabihub.kyc.entity.KycRequest;
import com.manabihub.kyc.enums.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KycRequestRepository extends JpaRepository<KycRequest, UUID> {
    List<KycRequest> findByStatusOrderByCreatedAtDesc(KycStatus status);
}
