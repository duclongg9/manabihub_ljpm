# Database Schema Ownership

## Goal
Clarify physical table ownership by JPA entities, ensuring a clean single source of truth per table.

## Physical Table Inventory (V002–V053)

All tables are created by Flyway migrations. "Latest migration" = most recent migration that alters the table schema (not seed/reference).

| Table | Created | Latest Schema Migration | Writable Owner | Compat. Mapping | State |
|---|---|---|---|---|---|
| `app_users` | V002 | V013 (add phone_number) | `identity.entity.AppUser` | `kyc.domain.AppUser` (`@Immutable`) | Active |
| `roles` | V002 | V002 | `identity.entity.Role` | — | Active |
| `permissions` | V002 | V002 | `identity.entity.Permission` | — | Active |
| `user_roles` | V002 | V002 | — (join table) | — | Active |
| `role_permissions` | V002 | V002 | — (join table) | — | Active |
| `internal_admin_accounts` | V002 | V049 (auth lifecycle) | `identity.entity.InternalAdminAccount` | `kyc.domain.InternalAdminAccount` (`@Immutable`) | Active |
| `internal_admin_roles` | V002 | V002 | — (join table) | — | Active |
| `system_settings` | V002 | V002 | `identity.entity.SystemSetting` | — | Active |
| `audit_logs` | V002 | V002 | `common.entity.AuditLog` | — | Active |
| `student_profiles` | V002 | V002 | `identity.entity.StudentProfile` | — | Active |
| `teacher_profiles` | V002 | V002 | `identity.entity.TeacherProfile` | — | Active |
| `kyc_requests` | V002 | V006 (modular workflow) | `kyc.domain.KycRequest` | — | Active |
| `kyc_documents` | V002 | V004 (extend metadata) | `kyc.domain.KycDocument` | — | Active |
| `courses` | V002 | V037 (review status) | `course.entity.Course` | — | Active |
| `course_modules` | V002 | V018 (IF NOT EXISTS) | `course.entity.CourseModule` | — | Active |
| `lessons` | V002 | V002 | DB-only | — | Legacy |
| `lesson_blocks` | V002 | V047 (violation target) | DB-only | — | Legacy |
| `course_approval_decisions` | V002 | V002 | `course.entity.CourseApprovalDecision` | — | Active |
| `enrollments` | V002 | V002 | `learning.entity.Enrollment` | — | Active |
| `lesson_progress` | V002 | V002 | DB-only | — | Legacy (read-only) |
| `writing_submissions` | V002 | V026 (unique constraint) | `writing.entity.WritingSubmission` | — | Active |
| `ai_writing_suggestions` | V002 | V002 | `writing.entity.AiWritingSuggestion` | — | Active |
| `teacher_writing_feedback` | V002 | V002 | `writing.entity.TeacherWritingFeedback` | — | Active |
| `ai_usage_logs` | V002 | V022 (chat ref) | `ai.entity.AiUsageLog` | — | Active |
| `orders` | V002 | V053 (wallet amount) | `payment.entity.Order` | — | Active |
| `order_items` | V002 | V002 | `payment.entity.OrderItem` | — | Active |
| `payment_transactions` | V002 | V051 (success time) | `payment.entity.PaymentTransaction` | — | Active |
| `wallets` | V002 | V044 (integrity snapshots) | `wallet.entity.Wallet` | — | Active |
| `wallet_transactions` | V002 | V002 | `wallet.entity.WalletTransaction` | — | Active |
| `escrow_ledger` | V002 | V002 | `wallet.entity.EscrowLedger` | — | Active |
| `refund_requests` | V002 | V048 (harden refund) | `wallet.entity.RefundRequest` | — | Active |
| `withdrawal_requests` | V002 | V040 (secure withdrawal) | `wallet.entity.WithdrawalRequest` | — | Active |
| `payout_settlements` | V002 | V036 (uc33 payout) | `wallet.entity.PayoutSettlement` | — | Active |
| `violation_reports` | V002 | V047 (harden moderation) | `moderation.entity.ViolationReport` | — | Active |
| `moderation_decisions` | V002 | V002 | `moderation.entity.ModerationDecision` | — | Active |
| `notifications` | V002 | V012 (action_url) | `notification.entity.Notification` | — | Active |
| `mock_national_id_registry` | V008 | V008 | DB-only (test mock) | — | Active |
| `mock_jlpt_registry` | V009 | V009 | DB-only (test mock) | — | Active |
| `course_learning_goals` | V016 | V016 | `course.entity.CourseLearningGoal` | — | Active |
| `course_categories` | V017 | V017 | `course.entity.CourseCategory` | — | Active |
| `course_lesson_blocks` | V018 | V047 (violation target) | `course.entity.LessonBlock` | — | Active |
| `final_tests` | V020 | V020 | `finaltest.entity.FinalTest` | — | Active |
| `final_test_questions` | V020 | V020 | `finaltest.entity.FinalTestQuestion` | — | Active |
| `final_test_choices` | V020 | V020 | `finaltest.entity.FinalTestChoice` | — | Active |
| `teacher_identity_claims` | V023 | V023 | `kyc.domain.TeacherIdentityClaim` | — | Active |
| `lesson_block_progress` | V024 | V024 | `learning.entity.LessonBlockProgress` | — | Active |
| `flashcard_progress` | V025 | V025 | `learning.entity.FlashcardProgress` | — | Active |
| `quiz_attempts` | V027 | V027 | `learning.entity.QuizAttempt` | — | Active |
| `final_test_attempts` | V027 | V027 | `learning.entity.FinalTestAttempt` | — | Active |
| `learning_certificates` | V028 | V028 | `learning.entity.LearningCertificate` | — | Active |
| `student_wishlist` | V029 | V029 | `learning.entity.StudentWishlist` | — | Active |
| `teacher_bank_accounts` | V032 | V032 | `wallet.entity.TeacherBankAccount` | — | Active |
| `payout_reconciliation_logs` | V036 | V036 | `wallet.entity.PayoutReconciliationLog` | — | Active |
| `teacher_certificate_claims` | V038 | V038 | `kyc.domain.TeacherCertificateClaim` | — | Active |
| `withdrawal_otp_challenges` | V040 | V040 | `wallet.entity.WithdrawalOtpChallenge` | — | Active |
| `course_reviews` | V041 | V041 | `course.entity.CourseReview` | — | Active |
| `order_item_snapshots` | V044 | V044 | `payment.entity.OrderItemSnapshot` | — | Active |
| `platform_commission_ledgers` | V044 | V044 | `wallet.entity.PlatformCommissionLedger` | — | Active |
| `internal_admin_invitations` | V045 | V045 | `identity.entity.InternalAdminInvitation` | — | Active |
| `moderation_action_records` | V046 | V046 | `moderation.entity.ModerationActionRecord` | — | Active |
| `violation_evidence` | V047 | V047 | `moderation.entity.ViolationEvidence` | — | Active |
| `refund_provider_attempts` | V048 | V048 | `wallet.entity.RefundProviderAttempt` | — | Active |
| `internal_admin_sessions` | V049 | V049 | `identity.entity.InternalAdminSession` | — | Active |
| `internal_admin_refresh_tokens` | V049 | V049 | `identity.entity.InternalAdminRefreshToken` | — | Active |
| `internal_admin_password_resets` | V049 | V049 | `identity.entity.InternalAdminPasswordReset` | — | Active |
| `internal_admin_auth_rate_limits` | V049 | V049 | `identity.entity.InternalAdminAuthRateLimit` | — | Active |

> Entity class names use shortened package paths (e.g., `identity.entity.AppUser` = `com.manabihub.identity.entity.AppUser`).

## Key Indexes and Constraints (V031)

- **V031**: `V031__add_payment_transaction_idempotency.sql` — Creates `uq_payment_transactions_provider_txn`, a partial unique index on `payment_transactions (provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL`. This prevents duplicate webhook callbacks.

## Guidelines

1. **One Table, One Entity**: No two root `@Entity` classes should map to the same physical table with write privileges. Use `@Immutable` for cross-domain read-only access.
2. **Retirement Policy**: `lessons`, `lesson_blocks`, and `lesson_progress` have no active JPA writable owner. They are DB-only legacy tables retained for historical queries. Do not create synthetic JPA classes.
3. **Flyway Synchronization**: Every JPA entity change must have a corresponding Flyway migration. Entity state must mirror the DB state defined by migrations.
4. **No Fake Migrations**: Placeholder migrations (e.g., `SELECT 1`) are not allowed. If data backfills cannot be done safely, legacy data remains untouched.
