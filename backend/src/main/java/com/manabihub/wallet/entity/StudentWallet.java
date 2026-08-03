package com.manabihub.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A student's money wallet (MHB-37 top-up).
 * <p>
 * Legacy read-only projection. All balance writes are owned by {@link Wallet}.
 */
@Entity
@Table(name = "wallets")
@Immutable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentWallet {

    @Id
    @UuidGenerator
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.UUID)
    private java.util.UUID id;

    @Column(name = "owner_type", nullable = false)
    @Builder.Default
    private String ownerType = "STUDENT";

    @Column(name = "student_id", nullable = false, unique = true)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.UUID)
    private java.util.UUID studentId;

    /** Total money balance available to spend on purchases. */
    @Column(name = "balance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    /** Reserved/held portion of the balance (unused for students today; kept for schema parity). */
    @Column(name = "frozen_balance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal frozenBalance = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private boolean frozen = false;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "VND";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public BigDecimal getAvailableBalance() {
        return this.balance.subtract(this.frozenBalance);
    }
}
