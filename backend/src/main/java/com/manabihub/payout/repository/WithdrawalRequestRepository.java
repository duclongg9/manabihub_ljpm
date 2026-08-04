package com.manabihub.payout.repository;

import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, UUID>,
        JpaSpecificationExecutor<WithdrawalRequest> {
    Page<WithdrawalRequest> findByTeacherId(UUID teacherId, Pageable pageable);
    
    List<WithdrawalRequest> findByTeacherIdOrderByRequestedAtDesc(UUID teacherId);
    
    Optional<WithdrawalRequest> findByIdAndTeacherId(UUID id, UUID teacherId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select request
            from WithdrawalRequest request
            where request.id = :id and request.teacherId = :teacherId
            """)
    Optional<WithdrawalRequest> findByIdAndTeacherIdWithLock(
            @Param("id") UUID id,
            @Param("teacherId") UUID teacherId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from WithdrawalRequest request where request.id = :id")
    Optional<WithdrawalRequest> findByIdWithLock(@Param("id") UUID id);

    long countByTeacherIdAndStatus(UUID teacherId, WithdrawalStatus status);

    long countByTeacherIdAndCreatedAtAfter(UUID teacherId, java.time.LocalDateTime createdAt);
}
