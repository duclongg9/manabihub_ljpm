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
import com.manabihub.writing.entity.TeacherWritingFeedback;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.repository.AiWritingSuggestionRepository;
import com.manabihub.writing.repository.TeacherWritingFeedbackRepository;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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
                eq(submission.getStudent().getUser().getEmail()),
                eq("Giảng viên đã phản hồi bài viết"),
                eq("Bài viết của bạn trong khóa học N3 Writing đã được giảng viên nhận xét."),
                eq("TEACHER_WRITING_FEEDBACK"),
                eq("/student/courses/" + submission.getEnrollment().getCourse().getId() + "/learn")
        );
    }
}
