-- ============================================================================
-- V031__seed_demo_wallet_data.sql
-- MHB-36 / UC-17: Demo data so My Wallet is reviewable before UC-08 (Purchase),
-- UC-18 (Refund), UC-27 (Withdraw) and UC-33 (Payout) are implemented.
--
-- Uses the V003 demo accounts because those are the ones that actually hold a
-- role in user_roles and can therefore reach the wallet endpoints:
--   student.demo@manabihub.local -> student_profiles e0000000-...-0001
--   teacher.demo@manabihub.local -> teacher_profiles e0000000-...-0002
--   demo course                  -> courses          f0000000-...-0001 (250,000 VND)
--
-- Commission follows the seeded COMMISSION_RATE of 0.20, so each 250,000 VND
-- order yields 200,000 VND of teacher revenue.
--
-- Every statement uses ON CONFLICT DO NOTHING so re-running against an
-- already-seeded local database is safe.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Wallets
--    Student available balance : 250,000
--    Teacher available balance : 250,000 (excludes escrow still HELD)
-- ----------------------------------------------------------------------------
INSERT INTO wallets (id, owner_type, student_id, teacher_id, balance, frozen_balance, currency)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'STUDENT',
     'e0000000-0000-0000-0000-000000000001', NULL,
     250000.00, 0.00, 'VND'),
    ('a1000000-0000-0000-0000-000000000002', 'TEACHER',
     NULL, 'e0000000-0000-0000-0000-000000000002',
     250000.00, 0.00, 'VND')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Orders + items + payment transactions
-- ----------------------------------------------------------------------------
INSERT INTO orders (id, student_id, order_code, total_amount, currency, order_status, created_at)
VALUES
    ('a2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
     'MHB-DEMO-0001', 250000.00, 'VND', 'PAID',     NOW() - INTERVAL '40 days'),
    ('a2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001',
     'MHB-DEMO-0002', 250000.00, 'VND', 'PAID',     NOW() - INTERVAL '20 days'),
    ('a2000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001',
     'MHB-DEMO-0003', 250000.00, 'VND', 'PAID',     NOW() - INTERVAL '3 days'),
    ('a2000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001',
     'MHB-DEMO-0004', 250000.00, 'VND', 'REFUNDED', NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (id, order_id, course_id, price)
VALUES
    ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001', 250000.00),
    ('a3000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
     'f0000000-0000-0000-0000-000000000001', 250000.00),
    ('a3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003',
     'f0000000-0000-0000-0000-000000000001', 250000.00),
    ('a3000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000004',
     'f0000000-0000-0000-0000-000000000001', 250000.00)
ON CONFLICT DO NOTHING;

INSERT INTO payment_transactions (id, order_id, provider, provider_transaction_id, amount, status, created_at)
VALUES
    ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
     'MOCK_GATEWAY', 'MOCK-TXN-0001', 250000.00, 'SUCCESS',  NOW() - INTERVAL '40 days'),
    ('a4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
     'MOCK_GATEWAY', 'MOCK-TXN-0002', 250000.00, 'SUCCESS',  NOW() - INTERVAL '20 days'),
    ('a4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003',
     'MOCK_GATEWAY', 'MOCK-TXN-0003', 250000.00, 'SUCCESS',  NOW() - INTERVAL '3 days'),
    ('a4000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000004',
     'MOCK_GATEWAY', 'MOCK-TXN-0004', 250000.00, 'REFUNDED', NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Student ledger — top-up, payment and refund sections of UC-17.
--    Running balance ends at 250,000, matching the wallet row above.
-- ----------------------------------------------------------------------------
INSERT INTO wallet_transactions (
    id, wallet_id, transaction_type, amount, direction,
    reference_type, reference_id, note, balance_after, created_at
)
VALUES
    ('a5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
     'TOP_UP',   1000000.00, 'IN',  'TOP_UP', 'a7000000-0000-0000-0000-000000000001',
     'Nạp ví qua cổng thanh toán demo',   1000000.00, NOW() - INTERVAL '41 days'),
    ('a5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
     'PURCHASE',  250000.00, 'OUT', 'ORDER',  'a2000000-0000-0000-0000-000000000001',
     'Thanh toán đơn MHB-DEMO-0001',       750000.00, NOW() - INTERVAL '40 days'),
    ('a5000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
     'PURCHASE',  250000.00, 'OUT', 'ORDER',  'a2000000-0000-0000-0000-000000000002',
     'Thanh toán đơn MHB-DEMO-0002',       500000.00, NOW() - INTERVAL '20 days'),
    ('a5000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
     'PURCHASE',  250000.00, 'OUT', 'ORDER',  'a2000000-0000-0000-0000-000000000004',
     'Thanh toán đơn MHB-DEMO-0004',       250000.00, NOW() - INTERVAL '15 days'),
    ('a5000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
     'REFUND',    250000.00, 'IN',  'ORDER',  'a2000000-0000-0000-0000-000000000004',
     'Hoàn tiền đơn MHB-DEMO-0004',        500000.00, NOW() - INTERVAL '14 days'),
    ('a5000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001',
     'PURCHASE',  250000.00, 'OUT', 'ORDER',  'a2000000-0000-0000-0000-000000000003',
     'Thanh toán đơn MHB-DEMO-0003',       250000.00, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Escrow ledger — BR-ESC-01 (HELD = Pending Clearing) and
--    BR-ESC-02 (RELEASED after the clearing period).
-- ----------------------------------------------------------------------------
INSERT INTO escrow_ledger (id, order_id, course_id, teacher_id, amount, status, release_at, created_at)
VALUES
    ('a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
     200000.00, 'RELEASED', NOW() - INTERVAL '33 days', NOW() - INTERVAL '40 days'),
    ('a6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
     'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
     200000.00, 'RELEASED', NOW() - INTERVAL '13 days', NOW() - INTERVAL '20 days'),
    ('a6000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003',
     'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
     200000.00, 'HELD',     NOW() + INTERVAL '4 days',  NOW() - INTERVAL '3 days'),
    ('a6000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000004',
     'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
     200000.00, 'REFUNDED', NULL,                       NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Teacher ledger — only cleared revenue and payouts move the wallet
--    balance. Escrow still HELD lives in escrow_ledger only, so the Available
--    Balance never includes Pending Clearing money (BR-WAL-01).
--    400,000 released - 150,000 paid out = 250,000.
-- ----------------------------------------------------------------------------
INSERT INTO wallet_transactions (
    id, wallet_id, transaction_type, amount, direction,
    reference_type, reference_id, note, balance_after, created_at
)
VALUES
    ('a5000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000002',
     'ESCROW_RELEASE', 200000.00, 'IN',  'ESCROW', 'a6000000-0000-0000-0000-000000000001',
     'Giải ngân doanh thu đơn MHB-DEMO-0001', 200000.00, NOW() - INTERVAL '33 days'),
    ('a5000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000002',
     'ESCROW_RELEASE', 200000.00, 'IN',  'ESCROW', 'a6000000-0000-0000-0000-000000000002',
     'Giải ngân doanh thu đơn MHB-DEMO-0002', 400000.00, NOW() - INTERVAL '13 days'),
    ('a5000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000002',
     'PAYOUT',         150000.00, 'OUT', 'PAYOUT', 'a8000000-0000-0000-0000-000000000001',
     'Chi trả yêu cầu rút tiền kỳ trước',     250000.00, NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Withdrawal history + payout settlement (read-only in UC-17).
--    The PENDING request reserves 100,000 of the Available Balance, so the
--    wallet reports 150,000 as withdrawable.
-- ----------------------------------------------------------------------------
INSERT INTO withdrawal_requests (
    id, teacher_id, amount, status, bank_account_snapshot,
    requested_at, decided_by, decision_note, decided_at, created_at
)
VALUES
    ('a8000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
     150000.00, 'EXECUTED',
     '{"bankName":"Vietcombank","accountNumber":"****4321","accountHolder":"GIAO VIEN DEMO"}'::jsonb,
     NOW() - INTERVAL '10 days',
     'c0000000-0000-0000-0000-000000000003',
     'Đối soát khớp, đã thực hiện chi trả.',
     NOW() - INTERVAL '9 days',
     NOW() - INTERVAL '10 days'),
    ('a8000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002',
     100000.00, 'PENDING',
     '{"bankName":"Vietcombank","accountNumber":"****4321","accountHolder":"GIAO VIEN DEMO"}'::jsonb,
     NOW() - INTERVAL '1 days',
     NULL, NULL, NULL,
     NOW() - INTERVAL '1 days')
ON CONFLICT DO NOTHING;

INSERT INTO payout_settlements (
    id, withdrawal_request_id, executed_by, provider, provider_reference_id,
    amount, status, reconciliation_status, executed_at, created_at
)
VALUES (
    'a9000000-0000-0000-0000-000000000001',
    'a8000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'MOCK_BANK_TRANSFER', 'MOCK-PAYOUT-0001',
    150000.00, 'SUCCESS', 'MATCHED',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '9 days'
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Top-up history for the Student top-up section.
-- ----------------------------------------------------------------------------
INSERT INTO wallet_top_up_requests (
    id, wallet_id, student_id, amount, currency, status,
    provider, provider_reference, reference_code, confirmed_at, created_at
)
VALUES
    ('a7000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     1000000.00, 'VND', 'SUCCEEDED',
     'MOCK_GATEWAY', 'MOCK-TOPUP-0001', 'TOPUP-DEMO-0001',
     NOW() - INTERVAL '41 days', NOW() - INTERVAL '41 days'),
    ('a7000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     200000.00, 'VND', 'FAILED',
     'MOCK_GATEWAY', 'MOCK-TOPUP-0002', 'TOPUP-DEMO-0002',
     NULL, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
