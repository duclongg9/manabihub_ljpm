-- ============================================================================
-- V022__seed_demo_quiz_and_final_test.sql
-- Tự động seed dữ liệu bài Quiz & Final Test để Demo
-- ============================================================================

-- 1. Đánh dấu bài học duy nhất đã Hoàn thành (để đủ điều kiện Final Test = 100%)
INSERT INTO lesson_progress (id, enrollment_id, lesson_id, status, progress_percent, completed_at) VALUES
    ('b1000000-0000-0000-0000-000000000001',
     'f4000000-0000-0000-0000-000000000001', -- enrollment_id
     'f2000000-0000-0000-0000-000000000001', -- lesson_id
     'COMPLETED',
     100.00,
     NOW());

-- 2. Chèn 1 bài Quiz vào Module 1
INSERT INTO course_lesson_blocks (id, module_id, block_type, title, order_index, quiz_items_json) VALUES
    ('b0000000-0000-0000-0000-000000000001',
     'f1000000-0000-0000-0000-000000000001', -- module_id
     'QUIZ',
     'Demo Quiz',
     2,
     '[{"id":"q1","content":"JLPT là viết tắt của từ gì?","required":true,"explanation":"JLPT = Japanese Language Proficiency Test","options":[{"id":"opt1","content":"Japanese Language Proficiency Test","isCorrect":true},{"id":"opt2","content":"Japan Local Public Transit","isCorrect":false}]}]');

-- 3. Tạo bài Final Test cho khóa học
INSERT INTO final_tests (id, course_id, time_limit_minutes, passing_score, max_retakes, jlpt_level, skill_focus) VALUES
    ('d0000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001', -- course_id
     60,
     50,
     3,
     'N3',
     'COMPREHENSIVE');

INSERT INTO final_test_questions (id, final_test_id, content, explanation, order_index) VALUES
    ('e0000000-0000-0000-0000-000000000001',
     'd0000000-0000-0000-0000-000000000001',
     'Câu hỏi trắc nghiệm Final Test?',
     'Vì đó là quy luật',
     1);

INSERT INTO final_test_choices (id, question_id, content, is_correct, order_index) VALUES
    ('c0000000-0000-0000-0000-000000000001',
     'e0000000-0000-0000-0000-000000000001',
     'Đáp án đúng',
     TRUE,
     1);
