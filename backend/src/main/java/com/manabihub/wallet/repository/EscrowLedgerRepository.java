package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.enums.EscrowStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowLedgerRepository extends JpaRepository<EscrowLedger, UUID> {

    /** Idempotency guard: an order must never produce more than one escrow hold. */
    boolean existsByOrder_Id(UUID orderId);

    List<EscrowLedger> findByOrder_Id(UUID orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EscrowLedger e WHERE e.id = :id")
    Optional<EscrowLedger> findByIdForUpdate(@Param("id") UUID id);

    @Query("SELECT e FROM EscrowLedger e WHERE e.status = :status AND e.releaseAt <= :releaseAt " +
           "AND (e.createdAt > :lastCreatedAt OR (e.createdAt = :lastCreatedAt AND e.id > :lastId)) " +
           "ORDER BY e.createdAt ASC, e.id ASC")
    List<EscrowLedger> findNextEligibleChunk(
            @Param("status") EscrowStatus status,
            @Param("releaseAt") Instant releaseAt,
            @Param("lastCreatedAt") Instant lastCreatedAt,
            @Param("lastId") UUID lastId,
            Pageable pageable);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM refund_requests request
                WHERE request.order_id = :orderId
                  AND request.status IN ('PENDING', 'APPROVED')
            )
            """, nativeQuery = true)
    boolean existsBlockingRefundRequest(@Param("orderId") UUID orderId);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM violation_reports report
                WHERE report.status = 'PENDING'
                  AND (
                    (report.target_type = 'COURSE' AND report.target_id = :courseId)
                    OR
                    (report.target_type = 'USER' AND report.target_id = :teacherUserId)
                  )
            )
            """, nativeQuery = true)
    boolean existsPendingTrustCase(
            @Param("courseId") UUID courseId,
            @Param("teacherUserId") UUID teacherUserId);

    @Query("""
            select coalesce(sum(escrow.amount), 0)
            from EscrowLedger escrow
            where escrow.teacher.id = :teacherId
              and escrow.status = :status
            """)
    java.math.BigDecimal sumAmountByTeacherIdAndStatus(
            @Param("teacherId") UUID teacherId,
            @Param("status") EscrowStatus status
    );
}
