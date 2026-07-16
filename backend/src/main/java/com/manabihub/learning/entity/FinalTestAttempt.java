package com.manabihub.learning.entity;

import com.manabihub.finaltest.entity.FinalTest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "final_test_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalTestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "enrollment_id", nullable = false)
    private UUID enrollmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "final_test_id", nullable = false)
    private FinalTest finalTest;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(nullable = true)
    private Boolean passed; // changed from boolean to Boolean to allow null

    @Column(name = "answers_json", columnDefinition = "jsonb", nullable = true)
    private String answersJson; // removed nullable=false

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private FinalTestAttemptStatus status = FinalTestAttemptStatus.IN_PROGRESS;

    @Column(name = "start_time", nullable = false)
    @Builder.Default
    private ZonedDateTime startTime = ZonedDateTime.now();

    @Column(name = "submit_time")
    private ZonedDateTime submitTime;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
