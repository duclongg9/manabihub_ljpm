-- MHB-35 / UC-17: student wallet top-up requests.
-- A top-up is a money-in payment against the student's own wallet (rather than an order),
-- so it needs its own request row: payment_transactions.order_id is NOT NULL and a top-up
-- has no order. The wallet is only credited by the checksum-verified gateway callback
-- (NFR-SEC-14); the resulting ledger line is linked back via wallet_transaction_id.

CREATE TABLE wallet_topups (
    id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id               UUID           NOT NULL REFERENCES wallets (id),
    student_id              UUID           NOT NULL REFERENCES student_profiles (id),
    topup_code              VARCHAR(50)    NOT NULL UNIQUE,
    amount                  NUMERIC(12, 2) NOT NULL,
    currency                VARCHAR(10)    NOT NULL DEFAULT 'VND',
    status                  VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    provider                VARCHAR(50)    NOT NULL,
    provider_transaction_id VARCHAR(255),
    raw_response            JSONB,
    wallet_transaction_id   UUID           REFERENCES wallet_transactions (id),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_wallet_topups_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    CONSTRAINT chk_wallet_topups_amount CHECK (amount > 0)
);

CREATE INDEX idx_wallet_topups_student_created ON wallet_topups (student_id, created_at DESC);
CREATE INDEX idx_wallet_topups_wallet         ON wallet_topups (wallet_id);
CREATE INDEX idx_wallet_topups_status         ON wallet_topups (status);

-- Idempotency guard: a provider transaction id may back at most one top-up, so a replayed
-- gateway callback can never credit the wallet twice. Partial index because PENDING rows
-- have no provider id yet.
CREATE UNIQUE INDEX uq_wallet_topups_provider_txn
    ON wallet_topups (provider, provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL;
