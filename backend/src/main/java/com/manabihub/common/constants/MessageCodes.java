package com.manabihub.common.constants;

/**
 * Centralized message code constants for the ManabiHub API response convention.
 * <p>
 * <b>Naming convention:</b> {@code DOMAIN_ACTION_OR_STATE}
 * <ul>
 *   <li>Domain prefix groups codes by business module.</li>
 *   <li>Suffix describes the outcome or condition.</li>
 *   <li>All codes are UPPER_SNAKE_CASE.</li>
 * </ul>
 * <p>
 * <b>Frontend rule:</b> The frontend must use these codes for i18n display
 * mapping. Never parse raw {@code message} text for branching logic.
 * <p>
 * Codes defined here are the initial skeleton set. Each business module
 * should add its own codes as features are implemented.
 */
public final class MessageCodes {

    private MessageCodes() {
        // Prevent instantiation
    }

    // ──────────────────────────────────────────────
    // COMMON — generic cross-cutting codes
    // ──────────────────────────────────────────────
    public static final String COMMON_SUCCESS = "COMMON_SUCCESS";
    public static final String COMMON_CREATED = "COMMON_CREATED";
    public static final String COMMON_UPDATED = "COMMON_UPDATED";
    public static final String COMMON_DELETED = "COMMON_DELETED";
    public static final String COMMON_BAD_REQUEST = "COMMON_BAD_REQUEST";
    public static final String COMMON_NOT_FOUND = "COMMON_NOT_FOUND";
    public static final String COMMON_CONFLICT = "COMMON_CONFLICT";
    public static final String COMMON_INTERNAL_ERROR = "COMMON_INTERNAL_ERROR";

    // ──────────────────────────────────────────────
    // VALIDATION — input validation errors
    // ──────────────────────────────────────────────
    public static final String VALIDATION_FAILED = "VALIDATION_FAILED";

    // ──────────────────────────────────────────────
    // AUTH — authentication & authorization
    // ──────────────────────────────────────────────
    public static final String AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED";
    public static final String AUTH_FORBIDDEN = "AUTH_FORBIDDEN";
    public static final String AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";
    public static final String AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID";
    public static final String AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS";
    public static final String AUTH_LOGOUT_SUCCESS = "AUTH_LOGOUT_SUCCESS";

    // ──────────────────────────────────────────────
    // PROFILE — user profile management
    // ──────────────────────────────────────────────
    public static final String PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND";
    public static final String PROFILE_UPDATED = "PROFILE_UPDATED";

    // ──────────────────────────────────────────────
    // KYC — know your customer / teacher verification
    // ──────────────────────────────────────────────
    public static final String KYC_NOT_SUBMITTED = "KYC_NOT_SUBMITTED";
    public static final String KYC_PENDING = "KYC_PENDING";
    public static final String KYC_APPROVED = "KYC_APPROVED";
    public static final String KYC_REJECTED = "KYC_REJECTED";
    public static final String KYC_NOT_APPROVED = "KYC_NOT_APPROVED";

    // ──────────────────────────────────────────────
    // COURSE — course management
    // ──────────────────────────────────────────────
    public static final String COURSE_NOT_FOUND = "COURSE_NOT_FOUND";
    public static final String COURSE_CREATED = "COURSE_CREATED";
    public static final String COURSE_UPDATED = "COURSE_UPDATED";
    public static final String COURSE_DELETED = "COURSE_DELETED";
    public static final String COURSE_NOT_EDITABLE = "COURSE_NOT_EDITABLE";
    public static final String COURSE_NOT_PUBLISHED = "COURSE_NOT_PUBLISHED";
    public static final String COURSE_ALREADY_PUBLISHED = "COURSE_ALREADY_PUBLISHED";

    // ──────────────────────────────────────────────
    // CONTENT — lesson / content management
    // ──────────────────────────────────────────────
    public static final String CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND";
    public static final String CONTENT_CREATED = "CONTENT_CREATED";
    public static final String CONTENT_UPDATED = "CONTENT_UPDATED";
    public static final String CONTENT_DELETED = "CONTENT_DELETED";

    // ──────────────────────────────────────────────
    // FINAL_TEST — final test management
    // ──────────────────────────────────────────────
    public static final String FINAL_TEST_NOT_FOUND = "FINAL_TEST_NOT_FOUND";
    public static final String FINAL_TEST_CREATED = "FINAL_TEST_CREATED";
    public static final String FINAL_TEST_ALREADY_PASSED = "FINAL_TEST_ALREADY_PASSED";

    // ──────────────────────────────────────────────
    // LEARNING — student learning progress
    // ──────────────────────────────────────────────
    public static final String LEARNING_NOT_ENROLLED = "LEARNING_NOT_ENROLLED";
    public static final String LEARNING_ALREADY_ENROLLED = "LEARNING_ALREADY_ENROLLED";
    public static final String LEARNING_PROGRESS_UPDATED = "LEARNING_PROGRESS_UPDATED";

    // ──────────────────────────────────────────────
    // AI — AI-related operations
    // ──────────────────────────────────────────────
    public static final String AI_NOT_AVAILABLE = "AI_NOT_AVAILABLE";
    public static final String AI_NOT_AVAILABLE_FOR_COURSE = "AI_NOT_AVAILABLE_FOR_COURSE";
    public static final String AI_GENERATION_FAILED = "AI_GENERATION_FAILED";

    // ──────────────────────────────────────────────
    // PAYMENT — payment processing
    // ──────────────────────────────────────────────
    public static final String PAYMENT_SUCCESS = "PAYMENT_SUCCESS";
    public static final String PAYMENT_FAILED = "PAYMENT_FAILED";
    public static final String PAYMENT_WEBHOOK_INVALID = "PAYMENT_WEBHOOK_INVALID";
    public static final String PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND";

    // ──────────────────────────────────────────────
    // WALLET — wallet operations
    // ──────────────────────────────────────────────
    public static final String WALLET_NOT_FOUND = "WALLET_NOT_FOUND";
    public static final String WALLET_INSUFFICIENT_BALANCE = "WALLET_INSUFFICIENT_BALANCE";

    // ──────────────────────────────────────────────
    // REFUND — refund processing
    // ──────────────────────────────────────────────
    public static final String REFUND_NOT_ELIGIBLE = "REFUND_NOT_ELIGIBLE";
    public static final String REFUND_REQUESTED = "REFUND_REQUESTED";
    public static final String REFUND_PROCESSED = "REFUND_PROCESSED";

    // ──────────────────────────────────────────────
    // PAYOUT — teacher payout
    // ──────────────────────────────────────────────
    public static final String PAYOUT_NOT_ELIGIBLE = "PAYOUT_NOT_ELIGIBLE";
    public static final String PAYOUT_REQUESTED = "PAYOUT_REQUESTED";
    public static final String PAYOUT_PROCESSED = "PAYOUT_PROCESSED";

    // ──────────────────────────────────────────────
    // ADMIN — admin operations
    // ──────────────────────────────────────────────
    public static final String ADMIN_ACTION_SUCCESS = "ADMIN_ACTION_SUCCESS";
    public static final String ADMIN_ACTION_FORBIDDEN = "ADMIN_ACTION_FORBIDDEN";

    // ──────────────────────────────────────────────
    // NOTIFICATION — notification system
    // ──────────────────────────────────────────────
    public static final String NOTIFICATION_SENT = "NOTIFICATION_SENT";
    public static final String NOTIFICATION_FAILED = "NOTIFICATION_FAILED";

    // ──────────────────────────────────────────────
    // SYSTEM — system-level codes
    // ──────────────────────────────────────────────
    public static final String SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE";
    public static final String SYSTEM_RATE_LIMITED = "SYSTEM_RATE_LIMITED";
}
