package com.manabihub.learning.entity;

import com.manabihub.course.entity.LessonBlock;
import com.manabihub.learning.enums.FlashcardReviewStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "flashcard_progress",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_flashcard_progress",
                        columnNames = {
                                "enrollment_id",
                                "lesson_block_id",
                                "card_index"
                        }
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardProgress {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_block_id", nullable = false)
    private LessonBlock lessonBlock;

    @Column(name = "card_index", nullable = false)
    private Integer cardIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FlashcardReviewStatus status;

    @CreationTimestamp
    @Column(name = "reviewed_at", nullable = false, updatable = false)
    private Instant reviewedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}