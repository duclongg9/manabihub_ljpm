package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

    List<WalletTransaction> findByWallet_IdOrderByCreatedAtDesc(UUID walletId);

    List<WalletTransaction> findByReferenceTypeAndReferenceId(String referenceType, UUID referenceId);
}
