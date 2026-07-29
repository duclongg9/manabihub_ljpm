package com.manabihub.course.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.response.PublicCourseDetailResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.CourseValidationService;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.review.dto.response.CourseReviewAggregateResponse;
import com.manabihub.review.service.CourseReviewService;
import com.manabihub.systemconfig.service.SystemSettingValueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UC06ViewCourseDetailTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CourseCategoryRepository courseCategoryRepository;
    @Mock private TeacherProfileRepository teacherProfileRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private CourseValidationService courseValidationService;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;
    @Mock private CourseReviewService courseReviewService;
    @Mock private SystemSettingValueService settingValueService;

    private CourseServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CourseServiceImpl(
                courseRepository,
                courseCategoryRepository,
                teacherProfileRepository,
                currentUserService,
                courseValidationService,
                auditLogService,
                notificationService,
                courseReviewService,
                settingValueService
        );
    }

    @Test
    @Order(601)
    @DisplayName("UTC01: Guest views a published course by UUID")
    void testGetPublicCourseDetail_UTC01_GuestViewsPublishedCourseById() {
        Course course = publishedCourse();
        when(courseRepository.findByIdWithDetails(course.getId())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.empty());
        when(currentUserService.hasRole("ADMIN")).thenReturn(false);
        when(currentUserService.hasRole("SUPER_ADMIN")).thenReturn(false);
        when(courseReviewService.getAggregate(course.getId()))
                .thenReturn(new CourseReviewAggregateResponse(new BigDecimal("4.75"), 12));

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getId().toString());

        assertEquals(course.getId(), result.getId());
        assertEquals(2, result.getTotalLessons());
        assertEquals(25, result.getTotalDurationMinutes());
        assertEquals(new BigDecimal("4.75"), result.getAverageRating());
        assertEquals(12, result.getReviewCount());
        assertFalse(result.getIsEnrolled());
    }

    @Test
    @Order(602)
    @DisplayName("UTC02: Guest views a published course by slug")
    void testGetPublicCourseDetail_UTC02_GuestViewsPublishedCourseBySlug() {
        Course course = publishedCourse();
        when(courseRepository.findBySlugWithDetails(course.getSlug())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.empty());
        when(currentUserService.hasRole("ADMIN")).thenReturn(false);
        when(currentUserService.hasRole("SUPER_ADMIN")).thenReturn(false);
        when(courseReviewService.getAggregate(course.getId()))
                .thenReturn(CourseReviewAggregateResponse.empty());

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getSlug());

        assertEquals(course.getSlug(), result.getSlug());
        verify(courseRepository).findBySlugWithDetails(course.getSlug());
    }

    @Test
    @Order(603)
    @DisplayName("UTC03: Guest cannot view a draft course")
    void testGetPublicCourseDetail_UTC03_HiddenCourseDeniedForGuest() {
        Course course = publishedCourse();
        course.setStatus(CourseStatus.DRAFT);
        when(courseRepository.findByIdWithDetails(course.getId())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.empty());
        when(currentUserService.hasRole("ADMIN")).thenReturn(false);
        when(currentUserService.hasRole("SUPER_ADMIN")).thenReturn(false);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getPublicCourseDetail(course.getId().toString())
        );

        assertEquals(MessageCodes.MSG_CATALOG_001, exception.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        verify(courseReviewService, never()).getAggregate(course.getId());
    }

    @Test
    @Order(604)
    @DisplayName("UTC04: Missing course UUID returns 404")
    void testGetPublicCourseDetail_UTC04_MissingCourseReturnsNotFound() {
        UUID missingCourseId = UUID.randomUUID();
        when(courseRepository.findByIdWithDetails(missingCourseId)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getPublicCourseDetail(missingCourseId.toString())
        );

        assertEquals(MessageCodes.MSG_CATALOG_001, exception.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
    }

    @Test
    @Order(605)
    @DisplayName("UTC05: Missing course slug returns 404")
    void testGetPublicCourseDetail_UTC05_MissingSlugReturnsNotFound() {
        String missingSlug = "missing-course-slug";
        when(courseRepository.findBySlugWithDetails(missingSlug)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getPublicCourseDetail(missingSlug)
        );

        assertEquals(MessageCodes.MSG_CATALOG_001, exception.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
    }

    @Test
    @Order(606)
    @DisplayName("UTC06: Authenticated student's enrollment is returned")
    void testGetPublicCourseDetail_UTC06_AuthenticatedStudentEnrollmentReturned() {
        Course course = publishedCourse();
        UUID studentUserId = UUID.randomUUID();
        when(courseRepository.findByIdWithDetails(course.getId())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.of(studentUserId));
        when(currentUserService.hasRole("ADMIN")).thenReturn(false);
        when(currentUserService.hasRole("SUPER_ADMIN")).thenReturn(false);
        when(courseRepository.checkEnrollmentExists(course.getId(), studentUserId)).thenReturn(true);
        when(courseReviewService.getAggregate(course.getId()))
                .thenReturn(CourseReviewAggregateResponse.empty());

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getId().toString());

        assertTrue(result.getIsEnrolled());
        verify(courseRepository).checkEnrollmentExists(course.getId(), studentUserId);
    }

    @Test
    @Order(607)
    @DisplayName("UTC07: Author can view their own draft course")
    void testGetPublicCourseDetail_UTC07_AuthorCanViewOwnDraft() {
        Course course = publishedCourse();
        course.setStatus(CourseStatus.DRAFT);
        UUID authorUserId = course.getTeacher().getUser().getId();
        when(courseRepository.findByIdWithDetails(course.getId())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.of(authorUserId));
        when(currentUserService.hasRole("ADMIN")).thenReturn(false);
        when(currentUserService.hasRole("SUPER_ADMIN")).thenReturn(false);
        when(courseRepository.checkEnrollmentExists(course.getId(), authorUserId)).thenReturn(false);
        when(courseReviewService.getAggregate(course.getId()))
                .thenReturn(CourseReviewAggregateResponse.empty());

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getId().toString());

        assertEquals(course.getId(), result.getId());
    }

    @Test
    @Order(608)
    @DisplayName("UTC08: Admin can view a draft course")
    void testGetPublicCourseDetail_UTC08_AdminCanViewDraft() {
        Course course = publishedCourse();
        course.setStatus(CourseStatus.DRAFT);
        when(courseRepository.findByIdWithDetails(course.getId())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.empty());
        when(currentUserService.hasRole("ADMIN")).thenReturn(true);
        when(courseReviewService.getAggregate(course.getId()))
                .thenReturn(CourseReviewAggregateResponse.empty());

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getId().toString());

        assertEquals(course.getId(), result.getId());
    }

    @Test
    @Order(609)
    @DisplayName("UTC09: Empty course has zero lessons and duration")
    void testGetPublicCourseDetail_UTC09_EmptyCourseHasZeroLessonAndDurationBoundary() {
        Course course = publishedCourse();
        course.getModules().clear();
        mockGuestPublishedCourse(course);

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getId().toString());

        assertEquals(0, result.getTotalLessons());
        assertEquals(0, result.getTotalDurationMinutes());
        assertTrue(result.getModules().isEmpty());
    }

    @Test
    @Order(610)
    @DisplayName("UTC10: Null video duration counts the lesson but zero minutes")
    void testGetPublicCourseDetail_UTC10_NullVideoDurationCountsLessonButNotMinutes() {
        Course course = publishedCourse();
        course.getModules().getFirst().getBlocks().get(0).setDurationMinutes(null);
        course.getModules().getFirst().getBlocks().get(1).setDurationMinutes(99);
        mockGuestPublishedCourse(course);

        PublicCourseDetailResponse result = service.getPublicCourseDetail(course.getId().toString());

        assertEquals(2, result.getTotalLessons());
        assertEquals(0, result.getTotalDurationMinutes());
    }

    private void mockGuestPublishedCourse(Course course) {
        when(courseRepository.findByIdWithDetails(course.getId())).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserIdOptional()).thenReturn(Optional.empty());
        when(currentUserService.hasRole("ADMIN")).thenReturn(false);
        when(currentUserService.hasRole("SUPER_ADMIN")).thenReturn(false);
        when(courseReviewService.getAggregate(course.getId()))
                .thenReturn(CourseReviewAggregateResponse.empty());
    }

    private Course publishedCourse() {
        AppUser teacherUser = new AppUser();
        teacherUser.setId(UUID.randomUUID());
        teacherUser.setFullName("Nguyen Sensei");
        teacherUser.setEmail("teacher@example.com");
        teacherUser.setUserStatus(UserStatus.ACTIVE);

        TeacherProfile teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(teacherUser);
        teacher.setDisplayName("Nguyen Sensei");
        teacher.setKycStatus(TeacherKycStatus.APPROVED);
        teacher.setCanPublishCourse(true);

        Course course = Course.builder()
                .id(UUID.randomUUID())
                .teacher(teacher)
                .title("N4 Listening Essentials")
                .slug("n4-listening-essentials")
                .price(new BigDecimal("250000"))
                .currency("VND")
                .status(CourseStatus.PUBLISHED)
                .build();
        CourseModule module = CourseModule.builder()
                .id(UUID.randomUUID())
                .course(course)
                .title("Module 1")
                .orderIndex(1)
                .build();
        module.addBlock(LessonBlock.builder()
                .id(UUID.randomUUID())
                .type(LessonBlockType.VIDEO)
                .title("Video lesson")
                .durationMinutes(25)
                .orderIndex(1)
                .build());
        module.addBlock(LessonBlock.builder()
                .id(UUID.randomUUID())
                .type(LessonBlockType.TEXT)
                .title("Reading lesson")
                .orderIndex(2)
                .build());
        course.addModule(module);
        return course;
    }
}
