package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.EscrowEntry;
import com.manabihub.wallet.enums.EscrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface EscrowEntryRepository extends JpaRepository<EscrowEntry, UUID> {

    /**
     * BR-ESC-01: total revenue still Pending Clearing for a teacher.
     */
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM EscrowEntry e
            WHERE e.teacher.id = :teacherId
              AND e.status = :status
            """)
    BigDecimal sumAmountByTeacherAndStatus(
            @Param("teacherId") UUID teacherId,
            @Param("status") EscrowStatus status
    );

    List<EscrowEntry> findByTeacher_IdAndStatusOrderByReleaseAtAsc(
            UUID teacherId,
            EscrowStatus status
    );
}
