package com.manabihub.writing.enums;

/**
 * Represents the lifecycle status of a writing submission.
 *
 * <p>A submission starts as {@code DRAFT}, then is submitted for AI
 * writing assistance. After AI processing finishes successfully,
 * the submission becomes {@code SUGGESTION_READY}. If AI fails,
 * it becomes {@code SUGGESTION_FAILED}. Teacher feedback is
 * represented by {@code TEACHER_FEEDBACK_READY}.</p>
 */
public enum WritingSubmissionStatus {

    /**
     * Student is editing the writing and has not submitted yet.
     */
    DRAFT,

    /**
     * Student has submitted the writing.
     */
    SUBMITTED,

    /**
     * AI writing suggestion is currently being generated.
     */
    SUGGESTION_PROCESSING,

    /**
     * AI suggestions are available.
     */
    SUGGESTION_READY,

    /**
     * AI failed to generate suggestions.
     */
    SUGGESTION_FAILED,

    /**
     * Teacher has reviewed the submission and provided official feedback.
     */
    TEACHER_FEEDBACK_READY
}