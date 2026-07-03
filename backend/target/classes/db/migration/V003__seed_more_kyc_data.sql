-- Seed 3 new teachers for testing
INSERT INTO users (id, email, full_name, role, created_at, updated_at) VALUES
('d2222222-2222-2222-2222-222222222222', 'michael@manabihub.local', 'Michael Smith', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d3333333-3333-3333-3333-333333333333', 'sarah@manabihub.local', 'Sarah Johnson', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-4444-444444444444', 'david@manabihub.local', 'David Lee', 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed new KYC requests

-- 1. Pending with High Risk and VNPT Failed (To test Reject scenario)
INSERT INTO kyc_requests (
    id, teacher_id, status, display_name, id_card_front_url, id_card_back_url, 
    certificate_url, selfie_url, copyright_accepted, vnpt_verification_status, 
    vnpt_response_details, risk_level, decision_note, created_at, updated_at
) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    'PENDING_ADMIN_REVIEW',
    'Michael Smith',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://manabihub-kyc.s3.amazonaws.com/TOEIC_Certificate_2024.pdf',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    TRUE,
    'FAILED',
    '{"id_card_match": false, "selfie_match": false, "liveness": "FAILED"}',
    'HIGH',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. Pending with Medium Risk (To test Resubmission scenario)
INSERT INTO kyc_requests (
    id, teacher_id, status, display_name, id_card_front_url, id_card_back_url, 
    certificate_url, selfie_url, copyright_accepted, vnpt_verification_status, 
    vnpt_response_details, risk_level, decision_note, created_at, updated_at
) VALUES (
    'b3333333-3333-3333-3333-333333333333',
    'd3333333-3333-3333-3333-333333333333',
    'PENDING_ADMIN_REVIEW',
    'Sarah Johnson',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://manabihub-kyc.s3.amazonaws.com/IELTS_Certificate_2025.pdf',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    TRUE,
    'SUCCESS',
    '{"id_card_match": true, "selfie_match": true, "liveness": "PASSED"}',
    'MEDIUM',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Already Approved (To show history/read-only mode)
INSERT INTO kyc_requests (
    id, teacher_id, status, display_name, id_card_front_url, id_card_back_url, 
    certificate_url, selfie_url, copyright_accepted, vnpt_verification_status, 
    vnpt_response_details, risk_level, decision_note, created_at, updated_at, processed_by, processed_at
) VALUES (
    'b4444444-4444-4444-4444-444444444444',
    'd4444444-4444-4444-4444-444444444444',
    'APPROVED',
    'David Lee',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://manabihub-kyc.s3.amazonaws.com/PMP_Certificate_2024.pdf',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    TRUE,
    'SUCCESS',
    '{"id_card_match": true, "selfie_match": true, "liveness": "PASSED"}',
    'LOW',
    'Hồ sơ hợp lệ, đã duyệt. Thông tin rõ ràng.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'e0000000-0000-0000-0000-000000000000',
    CURRENT_TIMESTAMP
);
