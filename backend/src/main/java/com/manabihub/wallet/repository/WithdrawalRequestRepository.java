package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WithdrawalRequest;
import com.manabihub.wallet.enums.WithdrawalRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, UUID> {

    Page<WithdrawalRequest> findByTeacher_IdOrderByRequestedAtDesc(
            UUID teacherProfileId,
            Pageable pageable
    );

    /**
     * BR-WAL-01: amount currently reserved by open withdrawal requests. It must
     * be subtracted from the Available Balance before offering a new withdrawal.
     */
    @Query("""
            SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w
            WHERE w.teacher.id = :teacherId
              AND w.status IN :statuses
            """)
    BigDecimal sumAmountByTeacherAndStatuses(
            @Param("teacherId") UUID teacherId,
            @Param("statuses") Collection<WithdrawalRequestStatus> statuses
    );
}
