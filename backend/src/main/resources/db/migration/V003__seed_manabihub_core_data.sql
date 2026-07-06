-- ============================================================================
-- V003__seed_manabihub_core_data.sql
-- MHB-58: Seed development/demo data for ManabiHub
--
-- This seed data is for LOCAL DEVELOPMENT AND TESTING ONLY.
-- Do NOT use any values from this file in production environments.
--
-- Contents:
--   1. Roles (5)
--   2. Permissions (11)
--   3. Role-Permission mappings (RBAC matrix)
--   4. System Settings (10 config keys)
--   5. Internal Admin Accounts (3 demo accounts)
--   6. Internal Admin Role assignments
--   7. Demo App Users (student + teacher)
--   8. Demo Profiles (student + teacher)
--   9. Demo Course + Module + Lesson + Writing Block
--  10. Demo Enrollment + Writing Submission
--  11. AI Writing Suggestion (is_official = FALSE)
--  12. Teacher Writing Feedback (is_official = TRUE)
--  13. Demo Audit Log entry
-- ============================================================================


-- ============================================================================
-- 1. ROLES
-- ============================================================================
INSERT INTO roles (id, code, name, description) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'STUDENT',         'Student',         'Public student role for learners on the platform'),
    ('a0000000-0000-0000-0000-000000000002', 'TEACHER',         'Teacher',         'Public teacher role for course creators'),
    ('a0000000-0000-0000-0000-000000000003', 'SYSTEM_ADMIN',    'System Admin',    'Internal admin with full system configuration access'),
    ('a0000000-0000-0000-0000-000000000004', 'COURSE_MANAGER',  'Course Manager',  'Internal admin for KYC review, course approval, and content moderation'),
    ('a0000000-0000-0000-0000-000000000005', 'FINANCE_MANAGER', 'Finance Manager', 'Internal admin for refund review, payout execution, and financial reconciliation');


-- ============================================================================
-- 2. PERMISSIONS
-- ============================================================================
INSERT INTO permissions (id, code, name, description) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'SYSTEM_CONFIG_MANAGE',  'Manage System Configuration',  'Create, update, and delete system-wide settings'),
    ('b0000000-0000-0000-0000-000000000002', 'INTERNAL_ADMIN_MANAGE', 'Manage Internal Admin Accounts','Create, update, and disable internal admin accounts'),
    ('b0000000-0000-0000-0000-000000000003', 'INTERNAL_ROLE_ASSIGN',  'Assign Internal Roles',         'Assign or revoke roles for internal admin accounts'),
    ('b0000000-0000-0000-0000-000000000004', 'AUDIT_LOG_VIEW',        'View Audit Logs',               'View system audit trail and activity logs'),
    ('b0000000-0000-0000-0000-000000000005', 'KYC_REVIEW',            'Review Teacher KYC',            'Review and decide on teacher KYC verification requests'),
    ('b0000000-0000-0000-0000-000000000006', 'COURSE_REVIEW',         'Review Course Publication',     'Review and approve or reject course publication requests'),
    ('b0000000-0000-0000-0000-000000000007', 'VIOLATION_RESOLVE',     'Resolve Violation Reports',     'Review and resolve content violation reports'),
    ('b0000000-0000-0000-0000-000000000008', 'REFUND_REVIEW',         'Review Refund Requests',        'Review and decide on student refund requests'),
    ('b0000000-0000-0000-0000-000000000009', 'PAYOUT_EXECUTE',        'Execute Teacher Payouts',       'Execute and settle teacher withdrawal payouts'),
    ('b0000000-0000-0000-0000-00000000000a', 'FINANCE_EVIDENCE_VIEW', 'View Financial Evidence',       'View financial reports, reconciliation data, and payment evidence'),
    ('b0000000-0000-0000-0000-00000000000b', 'AI_CONFIG_MANAGE',      'Manage AI Configuration',       'Configure AI features, providers, and usage limits');


-- ============================================================================
-- 3. ROLE-PERMISSION MAPPINGS (RBAC Matrix)
--
-- SYSTEM_ADMIN:    config, admin accounts, role assignment, audit, AI config
-- COURSE_MANAGER:  KYC review, course approval, violation moderation
-- FINANCE_MANAGER: refund review, payout execution, financial evidence
--
-- NOTE: Course Manager does NOT have refund/payout permissions.
--       Finance Manager does NOT have KYC/course/moderation permissions.
-- ============================================================================

-- SYSTEM_ADMIN permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001'), -- SYSTEM_CONFIG_MANAGE
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002'), -- INTERNAL_ADMIN_MANAGE
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'), -- INTERNAL_ROLE_ASSIGN
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004'), -- AUDIT_LOG_VIEW
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-00000000000b'); -- AI_CONFIG_MANAGE

-- COURSE_MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005'), -- KYC_REVIEW
    ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006'), -- COURSE_REVIEW
    ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007'); -- VIOLATION_RESOLVE

-- FINANCE_MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000008'), -- REFUND_REVIEW
    ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000009'), -- PAYOUT_EXECUTE
    ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-00000000000a'); -- FINANCE_EVIDENCE_VIEW


-- ============================================================================
-- 4. SYSTEM SETTINGS
-- ============================================================================
INSERT INTO system_settings (id, setting_key, setting_value, value_type, description, is_editable) VALUES
    (gen_random_uuid(), 'COMMISSION_RATE',              '0.20',   'NUMBER',  'Platform commission rate (e.g., 0.20 = 20%)',                    TRUE),
    (gen_random_uuid(), 'COURSE_PRICE_FLOOR',           '0',      'NUMBER',  'Minimum allowed course price in VND (0 = free courses allowed)', TRUE),
    (gen_random_uuid(), 'AI_SUPPORT_PRICE_FLOOR',       '100000', 'NUMBER',  'Minimum course price (VND) to enable AI writing support',        TRUE),
    (gen_random_uuid(), 'REFUND_WINDOW_DAYS',           '7',      'NUMBER',  'Number of days after enrollment during which refund is allowed', TRUE),
    (gen_random_uuid(), 'REFUND_PROGRESS_LIMIT_PERCENT','30',     'NUMBER',  'Maximum course progress (%) allowed for refund eligibility',     TRUE),
    (gen_random_uuid(), 'ESCROW_HOLDING_DAYS',          '7',      'NUMBER',  'Number of days to hold funds in escrow before release',          TRUE),
    (gen_random_uuid(), 'PAYOUT_THRESHOLD',             '100000', 'NUMBER',  'Minimum balance (VND) required for teacher withdrawal request',  TRUE),
    (gen_random_uuid(), 'AI_ENABLED',                   'true',   'BOOLEAN', 'Global toggle for all AI features',                              TRUE),
    (gen_random_uuid(), 'AI_WRITING_ENABLED',           'true',   'BOOLEAN', 'Toggle for AI writing suggestion feature (suggestion-only, not grading)', TRUE),
    (gen_random_uuid(), 'AI_CHATBOT_ENABLED',           'true',   'BOOLEAN', 'Toggle for AI chatbot feature',                                  TRUE);


-- ============================================================================
-- 5. INTERNAL ADMIN ACCOUNTS (Demo / Local Development)
--
-- Demo password hash is for local development only. Do not use in production.
-- The BCrypt hash below corresponds to the password "Admin@123" and is
-- intended ONLY for local development and automated testing.
-- ============================================================================
INSERT INTO internal_admin_accounts (id, email, full_name, password_hash, account_status) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'sysadmin@manabihub.local',       'System Administrator',  '$2a$10$dummyHashForLocalDevOnlyDoNotUseInProductionEnvironment00', 'ACTIVE'),
    ('c0000000-0000-0000-0000-000000000002', 'course.manager@manabihub.local', 'Course Manager',        '$2a$10$dummyHashForLocalDevOnlyDoNotUseInProductionEnvironment00', 'ACTIVE'),
    ('c0000000-0000-0000-0000-000000000003', 'finance.manager@manabihub.local','Finance Manager',       '$2a$10$dummyHashForLocalDevOnlyDoNotUseInProductionEnvironment00', 'ACTIVE');


-- ============================================================================
-- 6. INTERNAL ADMIN ROLE ASSIGNMENTS
-- ============================================================================
INSERT INTO internal_admin_roles (admin_account_id, role_id) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'), -- sysadmin -> SYSTEM_ADMIN
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004'), -- course.manager -> COURSE_MANAGER
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005'); -- finance.manager -> FINANCE_MANAGER


-- ============================================================================
-- 7. DEMO APP USERS (Google OAuth mock)
-- ============================================================================
INSERT INTO app_users (id, email, full_name, provider, provider_user_id, user_status) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'student.demo@manabihub.local', 'Demo Student', 'GOOGLE', 'google-student-demo-001', 'ACTIVE'),
    ('d0000000-0000-0000-0000-000000000002', 'teacher.demo@manabihub.local', 'Demo Teacher', 'GOOGLE', 'google-teacher-demo-001', 'ACTIVE');

-- Assign roles to demo users
INSERT INTO user_roles (user_id, role_id) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'), -- student -> STUDENT
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'); -- teacher -> TEACHER


-- ============================================================================
-- 8. DEMO PROFILES
-- ============================================================================

-- Student profile
INSERT INTO student_profiles (id, user_id, display_name, jlpt_goal) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Há»c viÃªn Demo', 'N3');

-- Teacher profile (APPROVED, can publish)
INSERT INTO teacher_profiles (id, user_id, display_name, bio, kyc_status, can_publish_course) VALUES
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'GiÃ¡o viÃªn Demo', 'GiÃ¡o viÃªn tiáº¿ng Nháº­t vá»›i 5 nÄƒm kinh nghiá»‡m giáº£ng dáº¡y JLPT N3-N1.', 'APPROVED', TRUE);


-- ============================================================================
-- 9. DEMO COURSE + MODULE + LESSON + WRITING BLOCK
--    Course is AI-supported and priced above AI_SUPPORT_PRICE_FLOOR (100,000 VND)
-- ============================================================================

-- Published course
INSERT INTO courses (id, teacher_id, title, slug, description, level_code, price, currency, status, ai_supported, published_at) VALUES
    ('f0000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000002',
     'JLPT N3 ä½œæ–‡ãƒžã‚¹ã‚¿ãƒ¼ - Writing Practice',
     'jlpt-n3-writing-practice',
     'KhÃ³a há»c luyá»‡n viáº¿t tiáº¿ng Nháº­t JLPT N3 vá»›i há»— trá»£ AI suggestion. Bao gá»“m bÃ i táº­p viáº¿t thá»±c táº¿ vÃ  feedback tá»« giÃ¡o viÃªn.',
     'N3',
     250000.00,
     'VND',
     'PUBLISHED',
     TRUE,
     NOW());

-- Course module
INSERT INTO course_modules (id, course_id, title, description, order_index) VALUES
    ('f1000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001',
     'Module 1: åŸºæœ¬æ–‡æ³•ã®å¾©ç¿’ (Basic Grammar Review)',
     'Ã”n táº­p ngá»¯ phÃ¡p cÆ¡ báº£n N3 vÃ  luyá»‡n viáº¿t cÃ¢u Ä‘Æ¡n giáº£n.',
     1);

-- Writing lesson
INSERT INTO lessons (id, module_id, title, lesson_type, order_index, is_preview) VALUES
    ('f2000000-0000-0000-0000-000000000001',
     'f1000000-0000-0000-0000-000000000001',
     'BÃ i 1: Viáº¿t Ä‘oáº¡n vÄƒn tá»± giá»›i thiá»‡u (è‡ªå·±ç´¹ä»‹)',
     'WRITING',
     1,
     FALSE);

-- Writing prompt lesson block
INSERT INTO lesson_blocks (id, lesson_id, block_type, content, order_index) VALUES
    ('f3000000-0000-0000-0000-000000000001',
     'f2000000-0000-0000-0000-000000000001',
     'WRITING_PROMPT',
     '{
        "prompt": "è‡ªå·±ç´¹ä»‹ã®æ–‡ç« ã‚’200å­—ä»¥ä¸Šã§æ›¸ã„ã¦ãã ã•ã„ã€‚åå‰ã€å‡ºèº«ã€è¶£å‘³ã€æ—¥æœ¬èªžã‚’å‹‰å¼·ã™ã‚‹ç†ç”±ã‚’å«ã‚ã¦ãã ã•ã„ã€‚",
        "prompt_vi": "HÃ£y viáº¿t má»™t bÃ i tá»± giá»›i thiá»‡u báº±ng tiáº¿ng Nháº­t (tá»‘i thiá»ƒu 200 chá»¯). Bao gá»“m: tÃªn, quÃª quÃ¡n, sá»Ÿ thÃ­ch, lÃ½ do há»c tiáº¿ng Nháº­t.",
        "min_length": 200,
        "max_length": 1000,
        "rubric": {
            "grammar": {"weight": 30, "description": "Correct use of N3 grammar patterns"},
            "vocabulary": {"weight": 25, "description": "Appropriate vocabulary usage"},
            "structure": {"weight": 25, "description": "Logical paragraph structure"},
            "content": {"weight": 20, "description": "Relevant and complete content"}
        }
     }'::jsonb,
     1);


-- ============================================================================
-- 10. DEMO ENROLLMENT + WRITING SUBMISSION
-- ============================================================================

-- Enrollment
INSERT INTO enrollments (id, student_id, course_id, enrollment_status, enrolled_at) VALUES
    ('f4000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001',
     'ACTIVE',
     NOW());

-- Writing submission
INSERT INTO writing_submissions (id, enrollment_id, lesson_id, student_id, content, status) VALUES
    ('f5000000-0000-0000-0000-000000000001',
     'f4000000-0000-0000-0000-000000000001',
     'f2000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     'åˆã‚ã¾ã—ã¦ã€‚ç§ã¯ã‚°ã‚¨ãƒ³ãƒ»ãƒ´ã‚¡ãƒ³ãƒ»ã‚¢ãƒ³ã¨ç”³ã—ã¾ã™ã€‚ãƒ™ãƒˆãƒŠãƒ ã®ãƒ›ãƒ¼ãƒãƒŸãƒ³å¸‚ã‹ã‚‰æ¥ã¾ã—ãŸã€‚ä»Šã€å¤§å­¦ã§æƒ…å ±æŠ€è¡“ã‚’å‹‰å¼·ã—ã¦ã„ã¾ã™ã€‚è¶£å‘³ã¯èª­æ›¸ã¨ã‚²ãƒ¼ãƒ ã‚’ã™ã‚‹ã“ã¨ã§ã™ã€‚æ—¥æœ¬èªžã‚’å‹‰å¼·ã™ã‚‹ç†ç”±ã¯ã€å°†æ¥æ—¥æœ¬ã®ITä¼šç¤¾ã§åƒããŸã„ã‹ã‚‰ã§ã™ã€‚æ¯Žæ—¥ã€æ¼¢å­—ã¨æ–‡æ³•ã‚’ç·´ç¿’ã—ã¦ã„ã¾ã™ã€‚æ—¥æœ¬ã®æ–‡åŒ–ã«ã‚‚èˆˆå‘³ãŒã‚ã‚Šã¾ã™ã€‚ç‰¹ã«ã€æ—¥æœ¬ã®é£Ÿã¹ç‰©ãŒå¤§å¥½ãã§ã™ã€‚ã‚ˆã‚ã—ããŠé¡˜ã„ã—ã¾ã™ã€‚',
     'TEACHER_FEEDBACK_READY');


-- ============================================================================
-- 11. AI WRITING SUGGESTION (Suggestion-Only, NOT official)
--
-- IMPORTANT: is_official MUST be FALSE.
-- AI Writing provides preliminary suggestions only:
--   - grammar suggestions
--   - vocabulary suggestions
--   - sentence structure suggestions
--   - revision guidance
-- AI suggestions are NOT grades, NOT scores, NOT official assessments.
-- They cannot be used for pass/fail, course completion, certificates, or refund decisions.
-- ============================================================================
INSERT INTO ai_writing_suggestions (
    id, writing_submission_id, provider, suggestion_status,
    grammar_suggestions, vocabulary_suggestions, structure_suggestions,
    revision_guidance, confidence_level, is_official
) VALUES (
    'f6000000-0000-0000-0000-000000000001',
    'f5000000-0000-0000-0000-000000000001',
    'openai-gpt-4o',
    'READY',
    -- grammar_suggestions
    '[
        {
            "location": {"start": 72, "end": 85},
            "original": "è¶£å‘³ã¯èª­æ›¸ã¨ã‚²ãƒ¼ãƒ ã‚’ã™ã‚‹ã“ã¨ã§ã™",
            "suggestion": "è¶£å‘³ã¯èª­æ›¸ã‚’ã™ã‚‹ã“ã¨ã¨ã‚²ãƒ¼ãƒ ã‚’ã™ã‚‹ã“ã¨ã§ã™",
            "explanation": "When listing hobbies with ã™ã‚‹ verbs, each item should have its own ã™ã‚‹ for clarity.",
            "severity": "MINOR"
        },
        {
            "location": {"start": 120, "end": 140},
            "original": "æ¯Žæ—¥ã€æ¼¢å­—ã¨æ–‡æ³•ã‚’ç·´ç¿’ã—ã¦ã„ã¾ã™",
            "suggestion": "æ¯Žæ—¥ã€æ¼¢å­—ã¨æ–‡æ³•ã®ç·´ç¿’ã‚’ã—ã¦ã„ã¾ã™",
            "explanation": "Using ã®ç·´ç¿’ã‚’ã™ã‚‹ is more natural than directly using ã‚’ç·´ç¿’ã™ã‚‹ in this context.",
            "severity": "SUGGESTION"
        }
    ]'::jsonb,
    -- vocabulary_suggestions
    '[
        {
            "original": "æƒ…å ±æŠ€è¡“",
            "suggestion": "ITï¼ˆæƒ…å ±æŠ€è¡“ï¼‰",
            "explanation": "In casual Japanese writing, IT is commonly used. Consider adding æƒ…å ±æŠ€è¡“ in parentheses for clarity.",
            "severity": "SUGGESTION"
        },
        {
            "original": "é£Ÿã¹ç‰©",
            "suggestion": "æ–™ç†",
            "explanation": "æ–™ç† (cuisine/cooking) may be more specific than é£Ÿã¹ç‰© (food) when expressing cultural interest.",
            "severity": "MINOR"
        }
    ]'::jsonb,
    -- structure_suggestions
    '[
        {
            "aspect": "paragraph_flow",
            "suggestion": "Consider grouping related topics together. Current order: introduction â†’ studies â†’ hobbies â†’ Japanese study reason â†’ daily routine â†’ culture. Suggested: introduction â†’ studies â†’ Japanese study reason â†’ daily routine â†’ hobbies â†’ culture â†’ closing.",
            "severity": "SUGGESTION"
        },
        {
            "aspect": "transitions",
            "suggestion": "Add transition phrases like ã¾ãŸ (also), ã•ã‚‰ã« (furthermore), or ãã‚Œã‹ã‚‰ (and then) between topics for smoother flow.",
            "severity": "MINOR"
        }
    ]'::jsonb,
    -- revision_guidance (preliminary suggestion, not official feedback)
    'Overall, this is a well-structured self-introduction that covers all required topics. The grammar is mostly correct at the N3 level. Consider: (1) improving topic transitions with connecting phrases, (2) reorganizing paragraph flow for better logical progression, and (3) expanding on your interest in Japanese culture with specific examples. These are preliminary AI suggestions only â€” please wait for your teacher''s official feedback.',
    'MEDIUM',
    -- is_official MUST be FALSE â€” AI is suggestion-only, never official
    FALSE
);


-- ============================================================================
-- 12. TEACHER WRITING FEEDBACK (Official, is_official = TRUE)
--
-- This is the OFFICIAL teacher assessment, completely separate from AI suggestions.
-- Only teacher feedback counts for grading, pass/fail, and course completion.
-- ============================================================================
INSERT INTO teacher_writing_feedback (
    id, writing_submission_id, teacher_id, score, comment, rubric_result, is_official
) VALUES (
    'f7000000-0000-0000-0000-000000000001',
    'f5000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    7.50,
    'BÃ i viáº¿t tá»‘t! Em Ä‘Ã£ bao gá»“m Ä‘áº§y Ä‘á»§ cÃ¡c ná»™i dung yÃªu cáº§u. Ngá»¯ phÃ¡p N3 sá»­ dá»¥ng chÃ­nh xÃ¡c. Cáº§n cáº£i thiá»‡n thÃªm pháº§n liÃªn káº¿t giá»¯a cÃ¡c Ã½ vÃ  má»Ÿ rá»™ng pháº§n lÃ½ do há»c tiáº¿ng Nháº­t. HÃ£y thá»­ dÃ¹ng thÃªm cÃ¡c máº«u ngá»¯ phÃ¡p N3 nhÆ° ï½žãŸã‚ã«ã€ï½žã‚ˆã†ã«ã™ã‚‹ Ä‘á»ƒ nÃ¢ng cao cháº¥t lÆ°á»£ng bÃ i viáº¿t.',
    '{
        "grammar": {"score": 8.0, "max": 10, "weight": 30, "comment": "Good use of N3 grammar. Minor issues with ã™ã‚‹ verb listing."},
        "vocabulary": {"score": 7.0, "max": 10, "weight": 25, "comment": "Adequate vocabulary. Could use more varied expressions."},
        "structure": {"score": 7.0, "max": 10, "weight": 25, "comment": "All topics covered but transitions between ideas need improvement."},
        "content": {"score": 8.0, "max": 10, "weight": 20, "comment": "Complete and relevant content. Good personal details included."}
    }'::jsonb,
    -- is_official MUST be TRUE â€” only teacher feedback is official
    TRUE
);


-- ============================================================================
-- 13. DEMO AUDIT LOG
-- ============================================================================
INSERT INTO audit_logs (
    id, actor_type, actor_admin_id, actor_role_code,
    action, target_type, target_id,
    before_value, after_value, metadata,
    ip_address, user_agent
) VALUES (
    'f8000000-0000-0000-0000-000000000001',
    'INTERNAL_ADMIN',
    'c0000000-0000-0000-0000-000000000001',
    'SYSTEM_ADMIN',
    'UPDATE_SYSTEM_SETTING',
    'SYSTEM_SETTING',
    NULL,
    '{"setting_key": "COMMISSION_RATE", "old_value": "0.15"}'::jsonb,
    '{"setting_key": "COMMISSION_RATE", "new_value": "0.20"}'::jsonb,
    '{"reason": "Adjusted commission rate per business review"}'::jsonb,
    '127.0.0.1',
    'Mozilla/5.0 (Admin Portal) ManabiHub/1.0'
);
