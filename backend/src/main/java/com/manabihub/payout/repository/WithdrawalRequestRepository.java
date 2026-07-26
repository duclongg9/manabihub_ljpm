package com.manabihub.payout.repository;

import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, UUID> {
    Page<WithdrawalRequest> findByTeacherId(UUID teacherId, Pageable pageable);
    
    List<WithdrawalRequest> findByTeacherIdOrderByRequestedAtDesc(UUID teacherId);
    
    Optional<WithdrawalRequest> findByIdAndTeacherId(UUID id, UUID teacherId);

    long countByTeacherIdAndStatus(UUID teacherId, WithdrawalStatus status);

    long countByTeacherIdAndCreatedAtAfter(UUID teacherId, java.time.LocalDateTime createdAt);
}
