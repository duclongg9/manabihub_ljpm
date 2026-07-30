-- ==============================================================================
-- V999__seed_mock_refund_requests.sql
-- Seed dummy data to test Approve/Reject Refund Requests (Feature MHB-42 UC-32)
-- ==============================================================================

-- 1. Create Orders for the Student
-- Using existing student 'e0000000-0000-0000-0000-000000000001' 

-- Order 1 (For PENDING refund)
INSERT INTO orders (id, student_id, order_code, total_amount, currency, order_status, created_at, updated_at)
VALUES ('a1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'ORD-MOCK-001', 500000, 'VND', 'PAID', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Order 2 (For APPROVED refund)
INSERT INTO orders (id, student_id, order_code, total_amount, currency, order_status, created_at, updated_at)
VALUES ('a1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'ORD-MOCK-002', 750000, 'VND', 'REFUNDED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

-- Order 3 (For REJECTED refund)
INSERT INTO orders (id, student_id, order_code, total_amount, currency, order_status, created_at, updated_at)
VALUES ('a1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'ORD-MOCK-003', 990000, 'VND', 'PAID', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days');

-- 2. Create Order Items linking to the existing Course ('f0000000-0000-0000-0000-000000000001')
INSERT INTO order_items (id, order_id, course_id, price, created_at)
VALUES ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 500000, NOW() - INTERVAL '2 days');

INSERT INTO order_items (id, order_id, course_id, price, created_at)
VALUES ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 750000, NOW() - INTERVAL '5 days');

INSERT INTO order_items (id, order_id, course_id, price, created_at)
VALUES ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 990000, NOW() - INTERVAL '10 days');

-- 3. Create Order Item Snapshots
INSERT INTO order_item_snapshots (id, order_item_id, currency, gross_amount, commission_rate, commission_amount, teacher_net_amount, commercial_policy_version, escrow_days, created_at)
VALUES ('81000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'VND', 500000, 0.2000, 100000, 400000, 'v1.0', 14, NOW() - INTERVAL '2 days');

INSERT INTO order_item_snapshots (id, order_item_id, currency, gross_amount, commission_rate, commission_amount, teacher_net_amount, commercial_policy_version, escrow_days, created_at)
VALUES ('81000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'VND', 750000, 0.2000, 150000, 600000, 'v1.0', 14, NOW() - INTERVAL '5 days');

INSERT INTO order_item_snapshots (id, order_item_id, currency, gross_amount, commission_rate, commission_amount, teacher_net_amount, commercial_policy_version, escrow_days, created_at)
VALUES ('81000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'VND', 990000, 0.2000, 198000, 792000, 'v1.0', 14, NOW() - INTERVAL '10 days');

-- 4. Create Escrow Ledgers (Money held for teachers)
-- Using existing teacher 'e0000000-0000-0000-0000-000000000002' and course 'f0000000-0000-0000-0000-000000000001'

INSERT INTO escrow_ledger (id, order_id, order_item_id, course_id, teacher_id, amount, status, release_at, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 400000, 'HELD', NOW() + INTERVAL '12 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

INSERT INTO escrow_ledger (id, order_id, order_item_id, course_id, teacher_id, amount, status, release_at, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 600000, 'RELEASED', NOW() + INTERVAL '9 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

INSERT INTO escrow_ledger (id, order_id, order_item_id, course_id, teacher_id, amount, status, release_at, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 792000, 'HELD', NOW() + INTERVAL '4 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- 5. Create Refund Requests
-- One PENDING, one APPROVED, one REJECTED

INSERT INTO refund_requests (id, order_id, student_id, status, reason, created_at, updated_at)
VALUES ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'PENDING', 'Khóa học không phù hợp với trình độ, giảng viên không nhiệt tình.', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days');

INSERT INTO refund_requests (id, order_id, student_id, status, reason, decision_note, decided_by, decided_at, created_at, updated_at)
VALUES ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'APPROVED', 'Mua nhầm khóa học do nhấn đúp chuột', 'Hợp lệ. Chấp nhận hoàn tiền cho học viên.', 'c0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

INSERT INTO refund_requests (id, order_id, student_id, status, reason, decision_note, decided_by, decided_at, created_at, updated_at)
VALUES ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'REJECTED', 'Học được một nửa rồi nhưng thấy chán', 'Yêu cầu không hợp lệ. Học viên đã vượt quá tiến độ cho phép hoàn tiền theo chính sách.', 'c0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '9 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days');
