package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WalletTopUpRequest;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface WalletTopUpRequestRepository extends JpaRepository<WalletTopUpRequest, UUID> {

    Page<WalletTopUpRequest> findByStudent_IdOrderByCreatedAtDesc(
            UUID studentProfileId,
            Pageable pageable
    );

    boolean existsByStudent_IdAndStatus(UUID studentProfileId, WalletTopUpStatus status);

    boolean existsByReferenceCode(String referenceCode);

    /**
     * Money the student has already sent to the gateway but which the backend
     * has not confirmed yet. Shown separately so the balance stays truthful.
     */
    @Query("""
            SELECT COALESCE(SUM(r.amount), 0) FROM WalletTopUpRequest r
            WHERE r.student.id = :studentId
              AND r.status = :status
            """)
    BigDecimal sumAmountByStudentAndStatus(
            @Param("studentId") UUID studentId,
            @Param("status") WalletTopUpStatus status
    );
}
