package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.PlatformCommissionLedger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlatformCommissionLedgerRepository extends JpaRepository<PlatformCommissionLedger, UUID> {
    Optional<PlatformCommissionLedger> findByOrderItem_IdAndStatus(UUID orderItemId, PlatformCommissionLedger.CommissionStatus status);
}
