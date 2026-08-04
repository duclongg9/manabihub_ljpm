package com.manabihub.review.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.review.dto.request.UpsertCourseReviewRequest;
import com.manabihub.review.dto.response.CourseReviewResponse;
import com.manabihub.review.entity.CourseReview;
import com.manabihub.review.enums.CourseReviewStatus;
import com.manabihub.review.repository.CourseReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseReviewServiceImplTest {

    @Mock
    private CourseReviewRepository courseReviewRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private StudentProfileRepository studentProfileRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private CurrentUserService currentUserService;

    private CourseReviewServiceImpl service;
    private UUID currentUserId;
    private StudentProfile student;
    private Course course;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        service = new CourseReviewServiceImpl(
                courseReviewRepository,
                enrollmentRepository,
                studentProfileRepository,
                courseRepository,
                currentUserService
        );
        currentUserId = UUID.randomUUID();
        AppUser user = AppUser.builder()
                .id(currentUserId)
                .email("private@example.test")
                .fullName("Private Legal Name")
                .avatarUrl("/avatars/student.png")
                .build();
        student = StudentProfile.builder()
                .id(UUID.randomUUID())
                .user(user)
                .displayName("Học viên An")
                .build();
        course = Course.builder()
                .id(UUID.randomUUID())
                .status(CourseStatus.PUBLISHED)
                .build();
        enrollment = Enrollment.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .status(EnrollmentStatus.ACTIVE)
                .build();
    }

    @Test
    void upsert_createsOneReviewUsingLockedCurrentStudentsEnrollment() {
        mockLockedEnrollment();
        when(courseReviewRepository.findByEnrollment_Id(enrollment.getId()))
                .thenReturn(Optional.empty());
        when(courseReviewRepository.saveAndFlush(any(CourseReview.class)))
                .thenAnswer(invocation -> {
                    CourseReview review = invocation.getArgument(0);
                    review.setId(UUID.randomUUID());
                    review.setUpdatedAt(Instant.parse("2026-07-27T00:00:00Z"));
                    return review;
                });

        CourseReviewResponse response = service.upsertMyReview(
                course.getId(),
                new UpsertCourseReviewRequest(
                        5,
                        "  Nội dung  thực tế\nvà dễ hiểu.  "
                )
        );

        assertEquals(5, response.rating());
        assertEquals("Nội dung thực tế và dễ hiểu.", response.reviewText());
        assertEquals("Học viên An", response.authorDisplayName());
        ArgumentCaptor<CourseReview> saved = ArgumentCaptor.forClass(CourseReview.class);
        verify(courseReviewRepository).saveAndFlush(saved.capture());
        assertEquals(enrollment.getId(), saved.getValue().getEnrollment().getId());
        verify(enrollmentRepository).findByStudentIdAndCourseIdForReview(
                student.getId(),
                course.getId()
        );
    }

    @Test
    void upsert_samePayloadIsIdempotentAndDoesNotRewriteTimestamp() {
        mockLockedEnrollment();
        CourseReview existing = review(CourseReviewStatus.APPROVED);
        when(courseReviewRepository.findByEnrollment_Id(enrollment.getId()))
                .thenReturn(Optional.of(existing));

        CourseReviewResponse response = service.upsertMyReview(
                course.getId(),
                new UpsertCourseReviewRequest(5, existing.getReviewText())
        );

        assertEquals(existing.getId(), response.id());
        verify(courseReviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void upsert_hiddenReviewCannotSelfApproveThroughEdit() {
        mockLockedEnrollment();
        CourseReview existing = review(CourseReviewStatus.HIDDEN);
        when(courseReviewRepository.findByEnrollment_Id(enrollment.getId()))
                .thenReturn(Optional.of(existing));
        when(courseReviewRepository.saveAndFlush(existing)).thenReturn(existing);

        service.upsertMyReview(
                course.getId(),
                new UpsertCourseReviewRequest(4, "Nội dung đã được chỉnh sửa hợp lệ.")
        );

        assertEquals(CourseReviewStatus.HIDDEN, existing.getStatus());
    }

    @Test
    void upsert_rejectsRefundedOrRevokedEnrollment() {
        mockStudent();
        enrollment.setStatus(EnrollmentStatus.REFUNDED);
        when(enrollmentRepository.findByStudentIdAndCourseIdForReview(
                student.getId(),
                course.getId()
        )).thenReturn(Optional.of(enrollment));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.upsertMyReview(
                        course.getId(),
                        new UpsertCourseReviewRequest(
                                5,
                                "Nội dung hợp lệ nhưng đã hoàn tiền."
                        )
                )
        );

        assertEquals(
                MessageCodes.COURSE_REVIEW_NOT_ELIGIBLE,
                exception.getMessageCode()
        );
        verify(courseReviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void getMyReviewScopesLookupThroughCurrentStudentsEnrollment() {
        mockStudent();
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(
                student.getId(),
                course.getId()
        )).thenReturn(Optional.of(enrollment));
        CourseReview existing = review(CourseReviewStatus.APPROVED);
        when(courseReviewRepository.findByEnrollment_Id(enrollment.getId()))
                .thenReturn(Optional.of(existing));

        CourseReviewResponse response = service.getMyReview(course.getId());

        assertEquals(existing.getId(), response.id());
        assertEquals("Học viên An", response.authorDisplayName());
        verify(courseReviewRepository).findByEnrollment_Id(enrollment.getId());
    }

    private void mockLockedEnrollment() {
        mockStudent();
        when(enrollmentRepository.findByStudentIdAndCourseIdForReview(
                student.getId(),
                course.getId()
        )).thenReturn(Optional.of(enrollment));
    }

    private void mockStudent() {
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(studentProfileRepository.findByUser_Id(currentUserId))
                .thenReturn(Optional.of(student));
    }

    private CourseReview review(CourseReviewStatus status) {
        return CourseReview.builder()
                .id(UUID.randomUUID())
                .enrollment(enrollment)
                .rating(5)
                .reviewText("Nội dung thực tế và dễ hiểu.")
                .status(status)
                .createdAt(Instant.parse("2026-07-26T00:00:00Z"))
                .updatedAt(Instant.parse("2026-07-27T00:00:00Z"))
                .build();
    }
}
