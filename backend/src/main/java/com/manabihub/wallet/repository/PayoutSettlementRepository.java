package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.PayoutSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PayoutSettlementRepository extends JpaRepository<PayoutSettlement, UUID> {

    /**
     * Loads settlements for a page of withdrawal requests in a single query so
     * the history endpoint does not trigger an N+1 lookup.
     */
    List<PayoutSettlement> findByWithdrawalRequest_IdInOrderByCreatedAtDesc(
            Collection<UUID> withdrawalRequestIds
    );
}
