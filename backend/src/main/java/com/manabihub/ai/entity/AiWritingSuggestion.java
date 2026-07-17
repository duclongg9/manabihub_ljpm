package com.manabihub.ai.entity;

import com.manabihub.ai.enums.SuggestionStatus;
import com.manabihub.writing.entity.WritingSubmission;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

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
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "writing_submission_id", nullable = false)
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
     * Grammar suggestions (JSON).
     */
    @Lob
    @Column(name = "grammar_suggestions")
    private String grammarSuggestions;

    /**
     * Vocabulary suggestions (JSON).
     */
    @Lob
    @Column(name = "vocabulary_suggestions")
    private String vocabularySuggestions;

    /**
     * Structure suggestions (JSON).
     */
    @Lob
    @Column(name = "structure_suggestions")
    private String structureSuggestions;

    /**
     * AI revision guidance.
     */
    @Lob
    @Column(name = "revision_guidance")
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
     * Raw provider response.
     */
    @Lob
    @Column(name = "raw_response")
    private String rawResponse;

    /**
     * Failure reason if AI request failed.
     */
    @Lob
    @Column(name = "failure_reason")
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}