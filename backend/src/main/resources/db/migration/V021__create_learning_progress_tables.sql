-- ============================================================================
-- V021__create_learning_progress_tables.sql
-- UC-12: Create tables for tracking Quiz Attempts and Final Test Attempts
-- ============================================================================

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE,
    lesson_block_id UUID NOT NULL REFERENCES lesson_blocks (id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_enrollment ON quiz_attempts (enrollment_id);
CREATE INDEX idx_quiz_attempts_lesson_block ON quiz_attempts (lesson_block_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts (created_at);

CREATE TABLE final_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE,
    final_test_id UUID NOT NULL REFERENCES final_tests (id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_final_test_attempts_enrollment ON final_test_attempts (enrollment_id);
CREATE INDEX idx_final_test_attempts_final_test ON final_test_attempts (final_test_id);
CREATE INDEX idx_final_test_attempts_created_at ON final_test_attempts (created_at);
