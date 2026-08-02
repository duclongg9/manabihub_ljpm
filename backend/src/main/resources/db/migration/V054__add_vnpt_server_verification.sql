-- MHB-73: Add server-to-server VNPT verification support
-- Adds PENDING_SERVER_VERIFICATION enum value and server verification tracking columns

-- Add new enum value for identity_status
-- PostgreSQL enum ALTER TYPE ... ADD VALUE is safe (IF NOT EXISTS prevents re-run errors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'PENDING_SERVER_VERIFICATION'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'identity_verification_status')
    ) THEN
        -- The column uses VARCHAR/TEXT with @Enumerated(STRING), so no ALTER TYPE needed.
        -- This block is a no-op safety check.
        NULL;
    END IF;
END $$;

-- Add server verification tracking columns to kyc_requests
ALTER TABLE kyc_requests
    ADD COLUMN IF NOT EXISTS server_verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS server_verification_attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS server_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for finding pending verification requests that need server confirmation
CREATE INDEX IF NOT EXISTS idx_kyc_requests_pending_server_verification
    ON kyc_requests (identity_status, server_verification_expires_at)
    WHERE identity_status = 'PENDING_SERVER_VERIFICATION';
