package com.manabihub.payout.repository;

import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.enums.ReconciliationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, UUID> {
    Page<WithdrawalRequest> findByTeacherId(UUID teacherId, Pageable pageable);
    
    List<WithdrawalRequest> findByTeacherIdOrderByRequestedAtDesc(UUID teacherId);
    
    Optional<WithdrawalRequest> findByIdAndTeacherId(UUID id, UUID teacherId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from WithdrawalRequest request where request.id = :id")
    Optional<WithdrawalRequest> findByIdWithLock(@Param("id") UUID id);

    @Query("""
            SELECT request
            FROM WithdrawalRequest request
            WHERE (:status IS NULL OR request.status = :status)
              AND (:requestedFrom IS NULL OR request.requestedAt >= :requestedFrom)
              AND (:requestedTo IS NULL OR request.requestedAt <= :requestedTo)
              AND (
                    :teacherKeyword IS NULL
                    OR EXISTS (
                        SELECT teacher.id
                        FROM TeacherProfile teacher
                        WHERE teacher.id = request.teacherId
                          AND (
                              LOWER(COALESCE(teacher.displayName, '')) LIKE :teacherKeyword
                              OR LOWER(COALESCE(teacher.user.fullName, '')) LIKE :teacherKeyword
                              OR LOWER(COALESCE(teacher.user.email, '')) LIKE :teacherKeyword
                          )
                    )
              )
              AND (
                    :reconciliationStatus IS NULL
                    OR EXISTS (
                        SELECT settlement.id
                        FROM PayoutSettlement settlement
                        WHERE settlement.withdrawalRequestId = request.id
                          AND settlement.reconciliationStatus = :reconciliationStatus
                    )
              )
            """)
    Page<WithdrawalRequest> findPayoutQueue(
            @Param("status") WithdrawalStatus status,
            @Param("reconciliationStatus") ReconciliationStatus reconciliationStatus,
            @Param("teacherKeyword") String teacherKeyword,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedTo") LocalDateTime requestedTo,
            Pageable pageable
    );

    long countByTeacherIdAndStatus(UUID teacherId, WithdrawalStatus status);

    long countByTeacherIdAndCreatedAtAfter(UUID teacherId, java.time.LocalDateTime createdAt);
}
