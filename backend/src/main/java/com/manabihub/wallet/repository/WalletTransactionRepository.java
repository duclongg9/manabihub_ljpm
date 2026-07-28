package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, java.util.UUID> {

    Optional<WalletTransaction> findByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType,
            UUID referenceId,
            WalletTransactionType transactionType
    );

    boolean existsByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType,
            UUID referenceId,
            WalletTransactionType transactionType
    );
}
