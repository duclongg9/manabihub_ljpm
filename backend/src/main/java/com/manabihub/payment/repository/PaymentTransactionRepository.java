package com.manabihub.payment.repository;

import com.manabihub.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    /** Idempotency lookup for an already-recorded provider transaction. */
    Optional<PaymentTransaction> findByProviderAndProviderTransactionId(String provider, String providerTransactionId);

    boolean existsByProviderAndProviderTransactionId(String provider, String providerTransactionId);

    List<PaymentTransaction> findByOrder_IdOrderByCreatedAtDesc(UUID orderId);
}
