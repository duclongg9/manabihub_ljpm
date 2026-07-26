package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.enums.EscrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EscrowLedgerRepository extends JpaRepository<EscrowLedger, UUID> {

    /** Idempotency guard: an order must never produce more than one escrow hold. */
    boolean existsByOrder_Id(UUID orderId);

    List<EscrowLedger> findByOrder_Id(UUID orderId);

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
