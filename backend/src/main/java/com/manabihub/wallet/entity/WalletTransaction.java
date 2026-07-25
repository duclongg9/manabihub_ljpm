package com.manabihub.wallet.entity;

import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Immutable ledger entry of a wallet.
 * <p>
 * UC-17 step 3 and 6: this is the transaction history the user browses and
 * filters. Entries are never updated in place; a correction is a new
 * {@code ADJUSTMENT} entry.
 */
@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private WalletTransactionType transactionType;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    private WalletTransactionDirection direction;

    /** Domain of {@link #referenceId}, e.g. {@code ORDER}, {@code ESCROW}. */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /**
     * Related order / refund / payout identifier. UC-17 alternative flow 6a
     * shows it only when the caller is permitted to see the reference.
     */
    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /** Running balance right after this entry was applied. */
    @Column(name = "balance_after", precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
