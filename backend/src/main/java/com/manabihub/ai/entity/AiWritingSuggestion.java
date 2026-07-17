package com.manabihub.ai.entity;

import com.manabihub.ai.enums.SuggestionStatus;
import com.manabihub.writing.entity.WritingSubmission;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_writing_suggestions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiWritingSuggestion {

    @Id
    @GeneratedValue
    private UUID id;

    /**
     * Related writing submission.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "writing_submission_id",
            nullable = false,
            unique = true
    )
    private WritingSubmission writingSubmission;

    /**
     * AI provider.
     */
    @Column(length = 100)
    private String provider;

    /**
     * Suggestion status.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "suggestion_status", nullable = false, length = 30)
    private SuggestionStatus suggestionStatus = SuggestionStatus.READY;

    /**
     * Grammar suggestions (JSONB).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "grammar_suggestions", columnDefinition = "jsonb")
    private String grammarSuggestions;

    /**
     * Vocabulary suggestions (JSONB).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "vocabulary_suggestions", columnDefinition = "jsonb")
    private String vocabularySuggestions;

    /**
     * Structure suggestions (JSONB).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structure_suggestions", columnDefinition = "jsonb")
    private String structureSuggestions;

    /**
     * AI revision guidance.
     */
    @Column(name = "revision_guidance", columnDefinition = "TEXT")
    private String revisionGuidance;

    /**
     * LOW / MEDIUM / HIGH.
     */
    @Column(name = "confidence_level", length = 30)
    private String confidenceLevel;

    /**
     * Always false (AI suggestion only).
     */
    @Builder.Default
    @Column(name = "is_official", nullable = false)
    private Boolean official = false;

    /**
     * Raw provider response (JSONB).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_response", columnDefinition = "jsonb")
    private String rawResponse;

    /**
     * Failure reason if AI request failed.
     */
    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}