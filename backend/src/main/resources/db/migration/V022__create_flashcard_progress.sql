CREATE TABLE flashcard_progress
(
    id UUID PRIMARY KEY,

    enrollment_id UUID NOT NULL,

    lesson_block_id UUID NOT NULL,

    card_index INTEGER NOT NULL,

    status VARCHAR(30) NOT NULL,

    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP,

    CONSTRAINT fk_flashcard_progress_enrollment
        FOREIGN KEY (enrollment_id)
            REFERENCES enrollments(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_flashcard_progress_lesson_block
        FOREIGN KEY (lesson_block_id)
            REFERENCES course_lesson_blocks(id)
            ON DELETE CASCADE,

    CONSTRAINT uk_flashcard_progress
        UNIQUE (enrollment_id, lesson_block_id, card_index)
);

CREATE INDEX idx_flashcard_progress_enrollment
    ON flashcard_progress(enrollment_id);

CREATE INDEX idx_flashcard_progress_lesson_block
    ON flashcard_progress(lesson_block_id);