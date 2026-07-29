package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WalletTopUp;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, UUID> {

    boolean existsByTopUpCode(String topUpCode);

    Optional<WalletTopUp> findByTopUpCode(String topUpCode);

    List<WalletTopUp> findByStudent_IdOrderByCreatedAtDesc(UUID studentId);

    /**
     * Locks the top-up row so concurrent provider callbacks for the same reference are
     * serialized; combined with the {@code SUCCESS} status check this makes crediting
     * idempotent (NFR-REL-06).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM WalletTopUp t WHERE t.topUpCode = :code")
    Optional<WalletTopUp> findByTopUpCodeForUpdate(@Param("code") String code);
}
