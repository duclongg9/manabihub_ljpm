package com.manabihub.writing.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.course.entity.Course;
import com.manabihub.writing.dto.request.TeacherWritingFeedbackRequest;
import com.manabihub.writing.entity.AiWritingSuggestion;
import com.manabihub.writing.entity.TeacherWritingFeedback;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.repository.AiWritingSuggestionRepository;
import com.manabihub.writing.repository.TeacherWritingFeedbackRepository;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TeacherWritingReviewServiceImplTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private TeacherProfileRepository teacherProfileRepository;

    @Mock
    private WritingSubmissionRepository writingSubmissionRepository;

    @Mock
    private AiWritingSuggestionRepository aiWritingSuggestionRepository;

    @Mock
    private TeacherWritingFeedbackRepository teacherWritingFeedbackRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TeacherWritingReviewServiceImpl service;

    private UUID userId;
    private UUID teacherId;
    private UUID submissionId;
    private TeacherProfile teacher;
    private WritingSubmission submission;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        teacherId = UUID.randomUUID();
        submissionId = UUID.randomUUID();

        teacher = new TeacherProfile();
        teacher.setId(teacherId);

        AppUser studentUser = AppUser.builder()
                .id(UUID.randomUUID())
                .email("student@example.com")
                .fullName("Student A")
                .build();
        StudentProfile student = StudentProfile.builder()
                .id(UUID.randomUUID())
                .user(studentUser)
                .displayName("Student A")
                .build();
        Course course = Course.builder()
                .id(UUID.randomUUID())
                .title("N3 Writing")
                .teacher(teacher)
                .build();
        Enrollment enrollment = Enrollment.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .build();
        submission = WritingSubmission.builder()
                .id(submissionId)
                .enrollment(enrollment)
                .student(student)
                .lessonBlockId(UUID.randomUUID())
                .content("Japanese writing")
                .status(WritingSubmissionStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
    }

    @Test
    @Order(2601)
    @DisplayName("UTC01: Owned submission without feedback returns detail and default lesson title")
    void getSubmission_whenFeedbackIsMissing_returnsEmptyFeedbackState() {
        when(writingSubmissionRepository.findOwnedById(submissionId, teacherId))
                .thenReturn(Optional.of(submission));
        when(aiWritingSuggestionRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.empty());
        when(teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.empty());
        when(writingSubmissionRepository.findLessonTitle(submissionId))
                .thenReturn(Optional.empty());

        var result = service.getSubmission(submissionId);

        assertThat(result.id()).isEqualTo(submissionId);
        assertThat(result.lessonTitle()).isEqualTo("Writing activity");
        assertThat(result.aiSuggestion()).isNull();
        assertThat(result.teacherFeedback()).isNull();
    }

    @Test
    @Order(2602)
    @DisplayName("UTC02: Owned submission returns separate AI and official teacher feedback")
    void getSubmission_withAiAndTeacherFeedback_mapsBothFeedbackSources() {
        AiWritingSuggestion aiSuggestion = AiWritingSuggestion.builder()
                .id(UUID.randomUUID())
                .writingSubmission(submission)
                .status("READY")
                .revisionGuidance("Revise the particle usage.")
                .official(false)
                .createdAt(Instant.now())
                .build();
        TeacherWritingFeedback teacherFeedback = TeacherWritingFeedback.builder()
                .id(UUID.randomUUID())
                .writingSubmission(submission)
                .teacher(teacher)
                .score(new BigDecimal("8.50"))
                .comment("Good revision.")
                .official(true)
                .createdAt(Instant.now())
                .build();
        when(writingSubmissionRepository.findOwnedById(submissionId, teacherId))
                .thenReturn(Optional.of(submission));
        when(aiWritingSuggestionRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.of(aiSuggestion));
        when(teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.of(teacherFeedback));
        when(writingSubmissionRepository.findLessonTitle(submissionId))
                .thenReturn(Optional.of("Self introduction"));

        var result = service.getSubmission(submissionId);

        assertThat(result.lessonTitle()).isEqualTo("Self introduction");
        assertThat(result.aiSuggestion()).isNotNull();
        assertThat(result.aiSuggestion().official()).isFalse();
        assertThat(result.teacherFeedback()).isNotNull();
        assertThat(result.teacherFeedback().official()).isTrue();
        assertThat(result.teacherFeedback().score()).isEqualByComparingTo("8.50");
        assertThat(result.teacherFeedback().comment()).isEqualTo("Good revision.");
    }

    @Test
    @Order(2603)
    @DisplayName("UTC03: Teacher cannot open a submission outside owned courses")
    void getSubmission_whenNotOwned_returnsNotFound() {
        when(writingSubmissionRepository.findOwnedById(submissionId, teacherId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSubmission(submissionId))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(exception.getMessageCode()).isEqualTo("WRITING_SUBMISSION_NOT_FOUND");
                });
    }

    @Test
    @Order(2604)
    @DisplayName("UTC04: Missing teacher profile is forbidden")
    void getSubmission_whenTeacherProfileMissing_returnsForbidden() {
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSubmission(submissionId))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getMessageCode()).isEqualTo("AUTH_FORBIDDEN");
                });

        verifyNoInteractions(writingSubmissionRepository, teacherWritingFeedbackRepository,
                aiWritingSuggestionRepository, notificationService);
    }

    @Test
    @Order(2611)
    @DisplayName("UTC01: Existing official feedback is updated and student is notified")
    void saveFeedback_updatesSubmissionAndNotifiesStudent() {
        TeacherWritingFeedback feedback = TeacherWritingFeedback.builder()
                .id(UUID.randomUUID())
                .writingSubmission(submission)
                .teacher(teacher)
                .official(true)
                .createdAt(Instant.now())
                .build();
        when(writingSubmissionRepository.findOwnedByIdForUpdate(submissionId, teacherId))
                .thenReturn(Optional.of(submission));
        when(teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.of(feedback));
        when(aiWritingSuggestionRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.empty());
        when(writingSubmissionRepository.findLessonTitle(submissionId))
                .thenReturn(Optional.of("Self introduction"));

        var result = service.saveFeedback(
                submissionId,
                new TeacherWritingFeedbackRequest(new BigDecimal("8.50"), "Good revision.")
        );

        assertThat(submission.getStatus())
                .isEqualTo(WritingSubmissionStatus.TEACHER_FEEDBACK_READY);
        assertThat(feedback.getScore()).isEqualByComparingTo("8.50");
        assertThat(feedback.getComment()).isEqualTo("Good revision.");
        assertThat(result.teacherFeedback()).isNotNull();
        verify(notificationService).createNotification(
                eq(submission.getStudent().getUser().getId()),
                eq(null),
                eq("Writing feedback is ready"),
                eq("Your teacher has reviewed your writing submission for N3 Writing."),
                eq("TEACHER_WRITING_FEEDBACK")
        );
    }

    @Test
    @Order(2612)
    @DisplayName("UTC02: Missing teacher profile is forbidden")
    void saveFeedback_whenTeacherProfileMissing_returnsForbidden() {
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.saveFeedback(
                submissionId,
                new TeacherWritingFeedbackRequest(new BigDecimal("8.0"), "Good work")
        )).isInstanceOfSatisfying(BusinessException.class, exception -> {
            assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(exception.getMessageCode()).isEqualTo("AUTH_FORBIDDEN");
        });

        verifyNoInteractions(writingSubmissionRepository, teacherWritingFeedbackRepository,
                aiWritingSuggestionRepository, notificationService);
    }

    @Test
    @Order(2613)
    @DisplayName("UTC03: Comment-only feedback creates a new official record")
    void saveFeedback_withoutScore_createsOfficialCommentOnlyFeedback() {
        AtomicReference<TeacherWritingFeedback> savedFeedback = new AtomicReference<>();
        when(writingSubmissionRepository.findOwnedByIdForUpdate(submissionId, teacherId))
                .thenReturn(Optional.of(submission));
        when(teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenAnswer(invocation -> Optional.ofNullable(savedFeedback.get()));
        when(teacherWritingFeedbackRepository.save(any(TeacherWritingFeedback.class)))
                .thenAnswer(invocation -> {
                    TeacherWritingFeedback feedback = invocation.getArgument(0);
                    feedback.setId(UUID.randomUUID());
                    savedFeedback.set(feedback);
                    return feedback;
                });
        when(aiWritingSuggestionRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.empty());
        when(writingSubmissionRepository.findLessonTitle(submissionId))
                .thenReturn(Optional.empty());

        var result = service.saveFeedback(
                submissionId,
                new TeacherWritingFeedbackRequest(null, "  Comment only.  ")
        );

        assertThat(savedFeedback.get()).isNotNull();
        assertThat(savedFeedback.get().isOfficial()).isTrue();
        assertThat(savedFeedback.get().getScore()).isNull();
        assertThat(savedFeedback.get().getComment()).isEqualTo("Comment only.");
        assertThat(result.teacherFeedback()).isNotNull();
        assertThat(result.lessonTitle()).isEqualTo("Writing activity");
    }

    @Test
    @Order(2614)
    @DisplayName("UTC04: Non-owned submission cannot be updated")
    void saveFeedback_whenSubmissionNotOwned_returnsNotFound() {
        when(writingSubmissionRepository.findOwnedByIdForUpdate(submissionId, teacherId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.saveFeedback(
                submissionId,
                new TeacherWritingFeedbackRequest(new BigDecimal("8.0"), "Good work")
        )).isInstanceOfSatisfying(BusinessException.class, exception -> {
            assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(exception.getMessageCode()).isEqualTo("WRITING_SUBMISSION_NOT_FOUND");
        });

        verifyNoInteractions(teacherWritingFeedbackRepository, aiWritingSuggestionRepository,
                notificationService);
    }

    @Test
    @Order(2615)
    @DisplayName("UTC05: Feedback save failure does not notify the student")
    void saveFeedback_whenPersistenceFails_doesNotNotifyStudent() {
        TeacherWritingFeedback feedback = TeacherWritingFeedback.builder()
                .id(UUID.randomUUID()).writingSubmission(submission).teacher(teacher)
                .official(true).build();
        when(writingSubmissionRepository.findOwnedByIdForUpdate(submissionId, teacherId))
                .thenReturn(Optional.of(submission));
        when(teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId))
                .thenReturn(Optional.of(feedback));
        when(teacherWritingFeedbackRepository.save(feedback))
                .thenThrow(new org.springframework.dao.DataAccessResourceFailureException("db unavailable"));

        assertThatThrownBy(() -> service.saveFeedback(
                submissionId,
                new TeacherWritingFeedbackRequest(new BigDecimal("8.0"), "Good work")
        )).isInstanceOf(org.springframework.dao.DataAccessResourceFailureException.class);

        verifyNoInteractions(notificationService);
    }
}
