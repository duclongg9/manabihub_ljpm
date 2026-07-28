package com.manabihub.moderation.entity;

import com.manabihub.moderation.enums.ModerationActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "moderation_action_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationActionRecord {

    @Id
    @UuidGenerator
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderation_decision_id", nullable = false)
    private ModerationDecision moderationDecision;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ModerationActionType actionType;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.UUID)
    private UUID targetId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
