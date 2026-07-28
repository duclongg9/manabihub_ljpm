CREATE TABLE order_item_snapshots (
    id UUID PRIMARY KEY,
    order_item_id UUID NOT NULL UNIQUE REFERENCES order_items(id),
    currency VARCHAR(10) NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL CHECK (gross_amount >= 0),
    commission_rate NUMERIC(5, 4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
    commission_amount NUMERIC(12, 2) NOT NULL,
    teacher_net_amount NUMERIC(12, 2) NOT NULL,
    gateway_fee_amount NUMERIC(12, 2),
    commercial_policy_version VARCHAR(50) NOT NULL,
    escrow_days INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_gross_amount_split CHECK (gross_amount = commission_amount + teacher_net_amount)
);

CREATE TABLE platform_commission_ledgers (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Idempotency check: one order_item should only have one platform_commission_ledger for HELD
CREATE UNIQUE INDEX idx_uniq_commission_held 
ON platform_commission_ledgers(order_item_id) 
WHERE status = 'HELD';
