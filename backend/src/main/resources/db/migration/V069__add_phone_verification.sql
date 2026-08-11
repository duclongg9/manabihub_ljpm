-- Phone numbers are account-wide identities. Keep one canonical value and one
-- verified timestamp so both student and teacher profile endpoints share the
-- same uniqueness/immutability rule.
--
-- Legacy databases may contain the same optional phone number on more than one
-- account. Do not delete those accounts: preserve the deterministic owner and
-- clear only duplicate, unverified claims before enforcing uniqueness.
ALTER TABLE app_users
    ALTER COLUMN phone_number TYPE VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

UPDATE app_users
SET phone_number = CASE
    WHEN NULLIF(BTRIM(phone_number), '') IS NULL THEN NULL
    WHEN BTRIM(phone_number) LIKE '+84%' THEN '0' || SUBSTRING(BTRIM(phone_number) FROM 4)
    ELSE BTRIM(phone_number)
END;

-- A phone number that is already verified by multiple accounts is ambiguous
-- and must be reviewed by an operator. Silently selecting one would revoke a
-- verified identity from another account.
DO $$
DECLARE
    conflicting_verified_numbers INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflicting_verified_numbers
    FROM (
        SELECT phone_number
        FROM app_users
        WHERE phone_number IS NOT NULL
          AND phone_verified_at IS NOT NULL
        GROUP BY phone_number
        HAVING COUNT(*) > 1
    ) conflicts;

    IF conflicting_verified_numbers > 0 THEN
        RAISE EXCEPTION
            'V069 blocked: % canonical phone number(s) belong to multiple verified accounts; manual review is required before retrying',
            conflicting_verified_numbers;
    END IF;
END
$$;

-- Prefer a verified owner. If every claim is unverified, retain the oldest
-- account (then UUID as a stable tie-breaker) and clear the other claims.
WITH ranked_phone_claims AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY phone_number
               ORDER BY (phone_verified_at IS NOT NULL) DESC,
                        created_at ASC NULLS LAST,
                        id ASC
           ) AS claim_rank
    FROM app_users
    WHERE phone_number IS NOT NULL
), duplicate_unverified_claims AS (
    SELECT ranked.id
    FROM ranked_phone_claims ranked
    JOIN app_users users ON users.id = ranked.id
    WHERE ranked.claim_rank > 1
      AND users.phone_verified_at IS NULL
)
UPDATE app_users users
SET phone_number = NULL
FROM duplicate_unverified_claims duplicates
WHERE users.id = duplicates.id;

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
