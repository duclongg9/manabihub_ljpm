CREATE TABLE payout_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_request_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    gateway_provider VARCHAR(50),
    gateway_transaction_reference VARCHAR(100),
    manual_bank_transaction_reference VARCHAR(100),
    proof_file_id VARCHAR(255),
    reconciliation_status VARCHAR(50) NOT NULL,
    reconciliation_note VARCHAR(500),
    decision VARCHAR(50),
    decision_reason VARCHAR(500),
    decided_by UUID,
    decided_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    settled_at TIMESTAMP WITH TIME ZONE,
    failure_code VARCHAR(100),
    failure_message_sanitized VARCHAR(500),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_payout_settlements_withdrawal_request_id ON payout_settlements(withdrawal_request_id);
CREATE INDEX idx_payout_settlements_status ON payout_settlements(status);
