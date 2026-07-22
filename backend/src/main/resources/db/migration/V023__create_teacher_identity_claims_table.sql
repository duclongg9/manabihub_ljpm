-- ============================================================================
-- V023__create_teacher_identity_claims_table.sql
-- MHB-11: Rework identity duplicate protection across teachers.
-- ============================================================================

CREATE TABLE teacher_identity_claims (
    teacher_id UUID PRIMARY KEY REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    identity_fingerprint VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_identity_claims_fingerprint ON teacher_identity_claims(identity_fingerprint);
