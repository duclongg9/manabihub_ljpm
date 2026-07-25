-- ============================================================================
-- V030__extend_wallet_for_uc17.sql
-- MHB-36 / UC-17: Manage My Wallet
--
-- Additive changes only. Existing checksums for V001..V029 stay stable.
--
-- SRS trace:
--   UC-17  Manage My Wallet
--   BR-WAL-01  Withdrawal only from Available Balance (not Pending Clearing)
--   BR-WAL-02  Withdrawal must satisfy minimum payout threshold
--   BR-WAL-03  Frozen balance / locked account blocks withdrawal
--   BR-ESC-01  Paid order revenue is first recorded as Pending Clearing
--   BR-ESC-02  Revenue becomes Available only after the clearing period
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. One wallet per owner
--    UC-17 reads a single "My Wallet" per Student / Teacher. Without these
--    indexes a duplicated wallet row would silently split the balance.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallets_student_id
    ON wallets (student_id)
    WHERE student_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallets_teacher_id
    ON wallets (teacher_id)
    WHERE teacher_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Allow TOP_UP as a wallet transaction type
--    UC-17 normal flow step 4: Student sees a top-up section.
-- ----------------------------------------------------------------------------
ALTER TABLE wallet_transactions
    DROP CONSTRAINT IF EXISTS chk_wallet_tx_type;

ALTER TABLE wallet_transactions
    ADD CONSTRAINT chk_wallet_tx_type CHECK (
        transaction_type IN (
            'TOP_UP',
            'PURCHASE',
            'REFUND',
            'REVENUE_SHARE',
            'PAYOUT',
            'ADJUSTMENT',
            'ESCROW_HOLD',
            'ESCROW_RELEASE'
        )
    );

-- ----------------------------------------------------------------------------
-- 3. Balance snapshot after each ledger entry
--    NFR-UX-24: the wallet screen must clearly show how the balance moved.
-- ----------------------------------------------------------------------------
ALTER TABLE wallet_transactions
    ADD COLUMN IF NOT EXISTS balance_after NUMERIC(12, 2);

-- ----------------------------------------------------------------------------
-- 4. Wallet top-up requests
--    UC-17 alternative flow 4a: the Student starts a top-up and the system
--    waits for backend payment confirmation. NFR-SEC-14: never trust a
--    client-side payment result, so the request starts as PENDING and only a
--    confirmed gateway callback may move it to SUCCEEDED.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_top_up_requests (
    id                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id          UUID           NOT NULL REFERENCES wallets (id),
    student_id         UUID           NOT NULL REFERENCES student_profiles (id),
    amount             NUMERIC(12, 2) NOT NULL,
    currency           VARCHAR(10)    NOT NULL DEFAULT 'VND',
    status             VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    provider           VARCHAR(50),
    provider_reference VARCHAR(255),
    reference_code     VARCHAR(50)    UNIQUE NOT NULL,
    failure_reason     TEXT,
    confirmed_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ,

    CONSTRAINT chk_wallet_top_up_status CHECK (
        status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
    ),
    CONSTRAINT chk_wallet_top_up_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_wallet_top_up_requests_wallet_id
    ON wallet_top_up_requests (wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_top_up_requests_student_id
    ON wallet_top_up_requests (student_id);

CREATE INDEX IF NOT EXISTS idx_wallet_top_up_requests_status
    ON wallet_top_up_requests (status);

CREATE INDEX IF NOT EXISTS idx_wallet_top_up_requests_created_at
    ON wallet_top_up_requests (created_at);

-- ----------------------------------------------------------------------------
-- 5. Minimum top-up amount configuration
--    PAYOUT_THRESHOLD already exists (V003) and covers BR-WAL-02.
-- ----------------------------------------------------------------------------
INSERT INTO system_settings (id, setting_key, setting_value, value_type, description, is_editable)
VALUES (
    gen_random_uuid(),
    'WALLET_MIN_TOP_UP_AMOUNT',
    '50000',
    'NUMBER',
    'Minimum wallet top-up amount (VND) a Student may request in UC-17',
    TRUE
)
ON CONFLICT (setting_key) DO NOTHING;
