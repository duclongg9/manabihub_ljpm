package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, java.util.UUID> {
}
