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
import jakarta.persistence.Lob;
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
     * Student writing.
     */
    @Lob
    @Column(nullable = false)
    private String content;

    /**
     * Submission status.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private WritingSubmissionStatus status = WritingSubmissionStatus.SUBMITTED;

    /**
     * Submitted time.
     */
    @Column(name = "submitted_at")
    private Instant submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}