-- Add unique constraint for writing submissions per enrollment and lesson block
ALTER TABLE writing_submissions
    ADD CONSTRAINT uq_writing_submissions_enrollment_block UNIQUE (enrollment_id, lesson_block_id);

-- Add writing_submission_id to ai_usage_logs for tracking AI writing assistance feature usage
ALTER TABLE ai_usage_logs
    ADD COLUMN writing_submission_id UUID;
