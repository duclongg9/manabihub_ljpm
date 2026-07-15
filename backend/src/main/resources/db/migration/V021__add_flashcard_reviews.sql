CREATE TABLE flashcard_reviews (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                   student_id UUID NOT NULL REFERENCES student_profiles(id),

                                   lesson_block_id UUID NOT NULL REFERENCES course_lesson_blocks(id),

                                   card_index INT NOT NULL,

                                   status VARCHAR(20) NOT NULL,

                                   reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                                   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                                   updated_at TIMESTAMPTZ,

                                   CONSTRAINT chk_flashcard_review_status
                                       CHECK (status IN ('REMEMBERED', 'NEED_REVIEW', 'SKIPPED')),

                                   CONSTRAINT uq_flashcard_review
                                       UNIQUE(student_id, lesson_block_id, card_index)
);

CREATE INDEX idx_flashcard_review_student
    ON flashcard_reviews(student_id);

CREATE INDEX idx_flashcard_review_block
    ON flashcard_reviews(lesson_block_id);

CREATE INDEX idx_flashcard_review_status
    ON flashcard_reviews(status);