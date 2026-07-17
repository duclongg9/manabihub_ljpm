-- ============================================================================
-- V022__update_writing_submission_for_lesson_blocks.sql
-- MHB-29 / UC-14: Practice Writing Assignment
-- Repoint writing_submissions from lessons to course_lesson_blocks.
-- ============================================================================

-- Xóa dữ liệu demo (nếu có) để tránh lỗi FK
DELETE FROM ai_usage_logs;
DELETE FROM teacher_writing_feedback;
DELETE FROM ai_writing_suggestions;
DELETE FROM writing_submissions;

-- Xóa index cũ
DROP INDEX IF EXISTS idx_writing_submissions_lesson_id;

-- Xóa cột lesson_id
ALTER TABLE writing_submissions
DROP COLUMN IF EXISTS lesson_id;

-- Thêm lesson_block_id
ALTER TABLE writing_submissions
    ADD COLUMN lesson_block_id UUID NOT NULL
        REFERENCES course_lesson_blocks(id)
            ON DELETE CASCADE;

-- Index mới
CREATE INDEX idx_writing_submissions_lesson_block_id
    ON writing_submissions (lesson_block_id);