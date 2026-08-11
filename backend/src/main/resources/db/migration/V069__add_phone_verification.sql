-- Phone numbers are account-wide identities. Keep one canonical value and one
-- verified timestamp so both student and teacher profile endpoints share the
-- same uniqueness/immutability rule.
ALTER TABLE app_users
    ADD COLUMN phone_verified_at TIMESTAMPTZ;

UPDATE app_users
SET phone_number = '0' || SUBSTRING(phone_number FROM 4)
WHERE phone_number LIKE '+84%';

CREATE UNIQUE INDEX uq_app_users_phone_number
    ON app_users (phone_number)
    WHERE phone_number IS NOT NULL AND BTRIM(phone_number) <> '';

CREATE TABLE phone_verification_challenges (
    user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    code_hash VARCHAR(128) NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    resend_available_at TIMESTAMPTZ NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_phone_verification_failed_attempts CHECK (failed_attempts >= 0)
);
