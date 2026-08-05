package com.manabihub.payout.repository;

import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface WithdrawalRequestRepositoryCustom {

    /**
     * Finance payout queue lookup. Every filter is optional; omitted filters are
     * left out of the generated SQL entirely instead of being bound as null.
     */
    Page<WithdrawalRequest> findPayoutQueue(
            WithdrawalStatus status,
            ReconciliationStatus reconciliationStatus,
            String ownerKeyword,
            LocalDateTime requestedFrom,
            LocalDateTime requestedTo,
            Pageable pageable
    );
}
