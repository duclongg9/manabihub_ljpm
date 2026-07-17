package com.manabihub.writing.entity;

import com.manabihub.course.entity.LessonBlock;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.learning.entity.CourseEnrollment;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
@Table(name = "writing_submissions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WritingSubmission {

    @Id
    @GeneratedValue
    private UUID id;

    /**
     * Student enrollment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private CourseEnrollment enrollment;

    /**
     * Writing lesson block.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_block_id", nullable = false)
    private LessonBlock lessonBlock;

    /**
     * Student.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    /**
     * Student writing content.
     */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Submission status.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private WritingSubmissionStatus status = WritingSubmissionStatus.SUBMITTED;

    /**
     * Submitted time.
     */
    @Builder.Default
    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt = Instant.now();

    /**
     * Created time.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Updated time.
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public boolean isProcessing() {
        return status == WritingSubmissionStatus.SUGGESTION_PROCESSING;
    }

    public boolean isReady() {
        return status == WritingSubmissionStatus.SUGGESTION_READY;
    }
}