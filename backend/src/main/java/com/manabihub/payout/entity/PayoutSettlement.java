package com.manabihub.payout.entity;

import com.manabihub.payout.enums.PayoutStatus;
import com.manabihub.payout.enums.ReconciliationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payout_settlements")
@Getter
@Setter
public class PayoutSettlement {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "withdrawal_request_id", nullable = false)
    private UUID withdrawalRequestId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @Column(name = "gateway_provider")
    private String gatewayProvider;

    @Column(name = "gateway_transaction_reference")
    private String gatewayTransactionReference;

    @Column(name = "manual_bank_transaction_reference")
    private String manualBankTransactionReference;

    @Column(name = "proof_file_id")
    private String proofFileId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_status", nullable = false)
    private ReconciliationStatus reconciliationStatus;

    @Column(name = "reconciliation_note")
    private String reconciliationNote;

    @Column(name = "decision")
    private String decision;

    @Column(name = "decision_reason")
    private String decisionReason;

    @Column(name = "decided_by")
    private UUID decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "processing_started_at")
    private Instant processingStartedAt;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Column(name = "failure_code")
    private String failureCode;

    @Column(name = "failure_message_sanitized")
    private String failureMessageSanitized;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    private Long version;
}
