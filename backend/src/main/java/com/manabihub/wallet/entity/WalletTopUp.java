package com.manabihub.wallet.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A student's request to add money to their own wallet through the payment provider (UC-17,
 * alternative flow 4a).
 * <p>
 * The balance is credited only when the provider's checksum-verified callback confirms the
 * payment (NFR-SEC-14) — never from the browser redirect alone. {@link #walletTransaction}
 * links to the immutable ledger line created at that moment, which is what makes crediting
 * observably at-most-once (NFR-REL-06). Maps the {@code wallet_topups} table (V031).
 */
@Entity
@Table(name = "wallet_topups")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTopUp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    /** Our reference sent to the provider as {@code vnp_TxnRef}; prefixed {@code TU}. */
    @Column(name = "topup_code", nullable = false, unique = true, length = 50)
    private String topUpCode;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "VND";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WalletTopUpStatus status = WalletTopUpStatus.PENDING;

    /** Payment provider identifier, e.g. {@code VNPAY}. */
    @Column(nullable = false, length = 50)
    private String provider;

    /** Provider-side transaction id ({@code vnp_TransactionNo}); the callback idempotency key. */
    @Column(name = "provider_transaction_id", length = 255)
    private String providerTransactionId;

    /** Raw provider payload captured for audit/troubleshooting. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_response", columnDefinition = "jsonb")
    private JsonNode rawResponse;

    /** The credit ledger line created when this top-up succeeded; {@code null} until then. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_transaction_id")
    private WalletTransaction walletTransaction;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
