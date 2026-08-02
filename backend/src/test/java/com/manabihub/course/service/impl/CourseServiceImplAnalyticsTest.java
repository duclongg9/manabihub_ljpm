package com.manabihub.course.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.review.dto.response.CourseReviewAggregateResponse;
import com.manabihub.course.dto.response.TeacherCourseAnalyticsResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.review.service.CourseReviewService;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplAnalyticsTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private EscrowLedgerRepository escrowLedgerRepository;
    @Mock
    private CourseReviewService courseReviewService;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private TeacherProfileRepository teacherProfileRepository;

    @InjectMocks
    private CourseServiceImpl courseService;

    private UUID userId;
    private TeacherProfile teacherProfile;
    private Course course;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        teacherProfile = new TeacherProfile();
        teacherProfile.setId(UUID.randomUUID());
        teacherProfile.setKycStatus(com.manabihub.kyc.domain.TeacherKycStatus.APPROVED);
        course = Course.builder()
                .id(UUID.randomUUID())
                .teacher(teacherProfile)
                .build();
    }

    @Test
    void getCourseAnalytics_ShouldReturnCorrectMetrics() {
        Instant startDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant endDate = Instant.now();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacherProfile));
        when(courseRepository.findByIdAndTeacher_Id(course.getId(), teacherProfile.getId())).thenReturn(Optional.of(course));

        when(enrollmentRepository.countByCourseIdAndDateRange(course.getId(), startDate, endDate)).thenReturn(200L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.COMPLETED, startDate, endDate)).thenReturn(150L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.REFUNDED, startDate, endDate)).thenReturn(10L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.REVOKED, startDate, endDate)).thenReturn(5L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.ACTIVE, startDate, endDate)).thenReturn(35L);

        when(escrowLedgerRepository.sumGrossRevenueByCourseIdAndDateRange(course.getId(), startDate, endDate)).thenReturn(BigDecimal.valueOf(2000000));
        when(escrowLedgerRepository.sumNetRevenueByCourseIdAndDateRange(course.getId(), startDate, endDate)).thenReturn(BigDecimal.valueOf(1600000));

        when(courseReviewService.getAggregate(course.getId())).thenReturn(new CourseReviewAggregateResponse(BigDecimal.valueOf(4.5), 100));

        TeacherCourseAnalyticsResponse response = courseService.getCourseAnalytics(course.getId(), startDate, endDate);

        assertEquals(200L, response.getTotalEnrollment());
        assertEquals(35L, response.getActiveLearners());
        assertEquals(150L, response.getCompletedLearners());

        // 200 - 10 (refunded) - 5 (revoked) = 185 valid enrollments
        // 150 / 185 * 100 = 81.081081...
        assertEquals(81.08108108108108, response.getCompletionRate());
        assertEquals(5.0, response.getRefundRate());
        assertEquals(BigDecimal.valueOf(2000000), response.getGrossRevenue());
        assertEquals(BigDecimal.valueOf(1600000), response.getNetRevenue());
        assertEquals(BigDecimal.valueOf(4.5), response.getAverageRating());
        assertEquals(100L, response.getTotalReviews());

        verify(enrollmentRepository).countByCourseIdAndDateRange(course.getId(), startDate, endDate);
        verify(escrowLedgerRepository).sumGrossRevenueByCourseIdAndDateRange(course.getId(), startDate, endDate);
    }

    @Test
    void getCourseAnalytics_ShouldReturnZeroWhenNoData() {
        Instant startDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant endDate = Instant.now();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacherProfile));
        when(courseRepository.findByIdAndTeacher_Id(course.getId(), teacherProfile.getId())).thenReturn(Optional.of(course));

        when(enrollmentRepository.countByCourseIdAndDateRange(course.getId(), startDate, endDate)).thenReturn(0L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.COMPLETED, startDate, endDate)).thenReturn(0L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.REFUNDED, startDate, endDate)).thenReturn(0L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.REVOKED, startDate, endDate)).thenReturn(0L);
        when(enrollmentRepository.countByCourseIdAndStatusAndDateRange(course.getId(), EnrollmentStatus.ACTIVE, startDate, endDate)).thenReturn(0L);

        when(escrowLedgerRepository.sumGrossRevenueByCourseIdAndDateRange(course.getId(), startDate, endDate)).thenReturn(null);
        when(escrowLedgerRepository.sumNetRevenueByCourseIdAndDateRange(course.getId(), startDate, endDate)).thenReturn(null);
        when(courseReviewService.getAggregate(course.getId())).thenReturn(new CourseReviewAggregateResponse(BigDecimal.valueOf(0), 0));

        TeacherCourseAnalyticsResponse response = courseService.getCourseAnalytics(course.getId(), startDate, endDate);

        assertEquals(0L, response.getTotalEnrollment());
        assertEquals(0L, response.getActiveLearners());
        assertEquals(0L, response.getCompletedLearners());
        assertEquals(0.0, response.getCompletionRate());
        assertEquals(0.0, response.getRefundRate());
        assertEquals(BigDecimal.ZERO, response.getGrossRevenue());
        assertEquals(BigDecimal.ZERO, response.getNetRevenue());
        assertEquals(BigDecimal.ZERO, response.getAverageRating());
        assertEquals(0L, response.getTotalReviews());
    }

    @Test
    void getCourseAnalytics_ShouldThrowWhenStartDateAfterEndDate() {
        Instant startDate = Instant.now();
        Instant endDate = Instant.now().minus(1, ChronoUnit.DAYS);

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacherProfile));
        when(courseRepository.findByIdAndTeacher_Id(course.getId(), teacherProfile.getId())).thenReturn(Optional.of(course));

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.getCourseAnalytics(course.getId(), startDate, endDate));
        assertEquals("Start date must be before or equal to end date", exception.getMessage());
    }

    @Test
    void getCourseAnalytics_ShouldThrowWhenEndDateInFuture() {
        Instant startDate = Instant.now();
        Instant endDate = Instant.now().plus(2, ChronoUnit.HOURS); // More than 1 hour buffer

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacherProfile));
        when(courseRepository.findByIdAndTeacher_Id(course.getId(), teacherProfile.getId())).thenReturn(Optional.of(course));

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.getCourseAnalytics(course.getId(), startDate, endDate));
        assertEquals("End date cannot be in the future", exception.getMessage());
    }

    @Test
    void getCourseAnalytics_ShouldThrowWhenRangeExceeds366Days() {
        Instant endDate = Instant.now();
        Instant startDate = endDate.minus(367, ChronoUnit.DAYS);

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacherProfile));
        when(courseRepository.findByIdAndTeacher_Id(course.getId(), teacherProfile.getId())).thenReturn(Optional.of(course));

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.getCourseAnalytics(course.getId(), startDate, endDate));
        assertEquals("Date range cannot exceed 366 days", exception.getMessage());
    }

    @Test
    void getCourseAnalytics_ShouldThrowWhenUserDoesNotOwnCourse() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacherProfile));
        when(courseRepository.findByIdAndTeacher_Id(course.getId(), teacherProfile.getId())).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.getCourseAnalytics(course.getId(), null, null));
        assertEquals("Course not found", exception.getMessage());
    }
}
