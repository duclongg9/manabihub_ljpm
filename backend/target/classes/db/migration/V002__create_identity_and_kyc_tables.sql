-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create kyc_requests table
CREATE TABLE kyc_requests (
    id UUID PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    display_name VARCHAR(255),
    id_card_front_url VARCHAR(500),
    id_card_back_url VARCHAR(500),
    certificate_url VARCHAR(500),
    selfie_url VARCHAR(500),
    copyright_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    vnpt_verification_status VARCHAR(50),
    vnpt_response_details TEXT,
    risk_level VARCHAR(50),
    decision_note VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed users
INSERT INTO users (id, email, full_name, role, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000000', 'admin@manabihub.local', 'System Admin', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e0000000-0000-0000-0000-000000000000', 'manager@manabihub.local', 'Course Manager', 'COURSE_MANAGER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f0000000-0000-0000-0000-000000000000', 'finance@manabihub.local', 'Finance Manager', 'FINANCE_MANAGER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d0000000-0000-0000-0000-000000000000', 'teacher@manabihub.local', 'Eleanor Pena', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d1111111-1111-1111-1111-111111111111', 'johndoe@manabihub.local', 'John Doe', 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed pending KYC request for Eleanor Pena
INSERT INTO kyc_requests (
    id, teacher_id, status, display_name, id_card_front_url, id_card_back_url, 
    certificate_url, selfie_url, copyright_accepted, vnpt_verification_status, 
    vnpt_response_details, risk_level, decision_note, created_at, updated_at
) VALUES (
    'b0000000-0000-0000-0000-000000000000',
    'd0000000-0000-0000-0000-000000000000',
    'PENDING_ADMIN_REVIEW',
    'Eleanor Pena',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    'https://manabihub-kyc.s3.amazonaws.com/JLPT_N2_Certificate_2025.pdf',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    TRUE,
    'SUCCESS',
    '{"id_card_match": true, "selfie_match": true, "liveness": "PASSED"}',
    'LOW',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
