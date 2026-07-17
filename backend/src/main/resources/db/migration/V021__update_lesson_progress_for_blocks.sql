-- ============================================================================
-- V021__update_lesson_progress_for_blocks.sql
-- MHB-25 / UC-10: Study Course Lessons.
-- Repoint lesson_progress from the legacy lessons table to the course builder
-- course_lesson_blocks table, and add video resume position tracking.
-- The table has never been used (no seeds, no code), so it is safe to clear.
-- ============================================================================

DELETE FROM lesson_progress;

ALTER TABLE lesson_progress
    DROP CONSTRAINT IF EXISTS uq_lesson_progress_enrollment_lesson;

DROP INDEX IF EXISTS idx_lesson_progress_lesson_id;

ALTER TABLE lesson_progress
    DROP COLUMN IF EXISTS lesson_id;

ALTER TABLE lesson_progress
    ADD COLUMN lesson_block_id UUID NOT NULL REFERENCES course_lesson_blocks (id) ON DELETE CASCADE,
    ADD COLUMN last_video_position_seconds INT;

ALTER TABLE lesson_progress
    ADD CONSTRAINT uq_lesson_progress_enrollment_block UNIQUE (enrollment_id, lesson_block_id),
    ADD CONSTRAINT chk_lesson_progress_video_position
        CHECK (last_video_position_seconds IS NULL OR last_video_position_seconds >= 0);

CREATE INDEX idx_lesson_progress_lesson_block_id ON lesson_progress (lesson_block_id);
