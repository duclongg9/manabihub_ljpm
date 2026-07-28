package com.manabihub.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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

@Entity
@Table(name = "order_item_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false, unique = true)
    private OrderItem orderItem;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate;

    @Column(name = "commission_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "teacher_net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal teacherNetAmount;

    @Column(name = "gateway_fee_amount", precision = 12, scale = 2)
    private BigDecimal gatewayFeeAmount;

    @Column(name = "commercial_policy_version", nullable = false, length = 50)
    private String commercialPolicyVersion;

    @Column(name = "escrow_days", nullable = false)
    private Integer escrowDays;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
