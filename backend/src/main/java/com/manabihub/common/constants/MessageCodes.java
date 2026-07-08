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
    public static final String MSG_COM_002 = "MSG-COM-002"; // Required field is empty
    public static final String MSG_COM_004 = "MSG-COM-004";

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
    public static final String MSG_AUTH_007 = "MSG-AUTH-007"; // Admin login failed
    public static final String MSG_AUTH_008 = "MSG-AUTH-008"; // Admin account locked
    public static final String MSG_AUTH_009 = "MSG-AUTH-009";

    // ──────────────────────────────────────────────
    // PROFILE — user profile management
    // ──────────────────────────────────────────────
    public static final String MSG_PRO_001 = "MSG-PRO-001";
    public static final String MSG_PRO_002 = "MSG-PRO-002";


    // ──────────────────────────────────────────────
    // KYC — know your customer / teacher verification
    // ──────────────────────────────────────────────
    public static final String KYC_NOT_SUBMITTED = "KYC_NOT_SUBMITTED";
    public static final String KYC_PENDING = "KYC_PENDING";
    public static final String KYC_APPROVED = "KYC_APPROVED";
    public static final String KYC_REJECTED = "KYC_REJECTED";
    public static final String KYC_NOT_APPROVED = "KYC_NOT_APPROVED";
    public static final String KYC_RESUBMISSION_REQUIRED = "KYC_RESUBMISSION_REQUIRED";
    public static final String KYC_TEACHER_NOT_FOUND = "KYC_TEACHER_NOT_FOUND";
    public static final String KYC_ALREADY_PENDING = "KYC_ALREADY_PENDING";
    public static final String KYC_ALREADY_APPROVED = "KYC_ALREADY_APPROVED";
    public static final String KYC_SUBMISSION_NOT_ALLOWED = "KYC_SUBMISSION_NOT_ALLOWED";
    public static final String MSG_KYC_002 = "MSG-KYC-002";
    public static final String MSG_KYC_003 = "MSG-KYC-003";
    public static final String MSG_KYC_006 = "MSG-KYC-006";
    public static final String MSG_KYC_008 = "MSG-KYC-008";
    public static final String MSG_KYC_009 = "MSG-KYC-009";
    public static final String MSG_KYC_010 = "MSG-KYC-010";
    public static final String MSG_ADM_002 = "MSG-ADM-002";

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
    public static final String MSG_PROD_001 = "MSG-PROD-001";
    public static final String MSG_PROD_002 = "MSG-PROD-002";
    public static final String MSG_COURSE_001 = "MSG-COURSE-001";
    public static final String MSG_COURSE_002 = "MSG-COURSE-002";
    public static final String MSG_COURSE_003 = "MSG-COURSE-003";
    public static final String MSG_COURSE_004 = "MSG-COURSE-004";
    public static final String MSG_COURSE_005 = "MSG-COURSE-005";
    public static final String MSG_COURSE_006 = "MSG-COURSE-006";
    public static final String MSG_COURSE_007 = "MSG-COURSE-007";
    public static final String MSG_COURSE_008 = "MSG-COURSE-008";
    public static final String MSG_COURSE_009 = "MSG-COURSE-009";
    public static final String MSG_COURSE_010 = "MSG-COURSE-010";
    public static final String MSG_COURSE_011 = "MSG-COURSE-011";
    public static final String MSG_COURSE_012 = "MSG-COURSE-012";
    public static final String MSG_COURSE_013 = "MSG-COURSE-013";
    public static final String MSG_COURSE_014 = "MSG-COURSE-014";
    public static final String MSG_COURSE_015 = "MSG-COURSE-015";
    public static final String MSG_COURSE_016 = "MSG-COURSE-016";
    public static final String MSG_COURSE_017 = "MSG-COURSE-017";
    public static final String MSG_COURSE_018 = "MSG-COURSE-018";
    public static final String MSG_COURSE_019 = "MSG-COURSE-019";
    public static final String MSG_GOAL_001 = "MSG-GOAL-001";
    public static final String MSG_GOAL_002 = "MSG-GOAL-002";
    public static final String MSG_GOAL_003 = "MSG-GOAL-003";
    public static final String MSG_GOAL_004 = "MSG-GOAL-004";
    public static final String MSG_WRITE_005 = "MSG-WRITE-005";
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
    public static final String MSG_FTEST_001 = "MSG-FTEST-001";
    public static final String MSG_FTEST_002 = "MSG-FTEST-002";
    public static final String MSG_FTEST_003 = "MSG-FTEST-003";
    public static final String MSG_FTEST_004 = "MSG-FTEST-004";

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
    public static final String COURSE_MANAGER_REQUIRED = "COURSE_MANAGER_REQUIRED";
    public static final String ADMIN_PERMISSION_DENIED = "ADMIN_PERMISSION_DENIED";

    // ──────────────────────────────────────────────
    // NOTIFICATION — notification system
    // ──────────────────────────────────────────────
    public static final String NOTIFICATION_SENT = "NOTIFICATION_SENT";
    public static final String NOTIFICATION_FAILED = "NOTIFICATION_FAILED";
    public static final String NOTIFICATION_NOT_FOUND = "NOTIFICATION_NOT_FOUND";

    // ──────────────────────────────────────────────
    // SYSTEM — system-level codes
    // ──────────────────────────────────────────────
    public static final String SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE";
    public static final String SYSTEM_RATE_LIMITED = "SYSTEM_RATE_LIMITED";

}
