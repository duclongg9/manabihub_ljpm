package com.manabihub.course.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;
import com.manabihub.course.dto.response.ValidationResultResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.enums.JlptLevel;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.CourseValidationService;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import com.manabihub.audit.service.AuditLogService;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.review.service.CourseReviewService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseCategoryRepository courseCategoryRepository;

    @Mock
    private TeacherProfileRepository teacherProfileRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private CourseValidationService courseValidationService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CourseReviewService courseReviewService;

    @InjectMocks
    private CourseServiceImpl courseService;
    private UUID userId;
    private TeacherProfile approvedTeacher;

    @BeforeEach
    void setUp() {
        courseService = new CourseServiceImpl(
                courseRepository,
                courseCategoryRepository,
                teacherProfileRepository,
                currentUserService,
                courseValidationService,
                auditLogService,
                notificationService,
                courseReviewService
        );
        userId = UUID.randomUUID();
        approvedTeacher = new TeacherProfile();
        approvedTeacher.setId(UUID.randomUUID());
        approvedTeacher.setKycStatus(TeacherKycStatus.APPROVED);
        approvedTeacher.setCanPublishCourse(true);
    }

    @Test
    void createDraft_WhenTeacherApproved_ShouldSaveDraftWithLearningGoals() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseCategoryRepository.existsByCodeAndActiveTrue("GRAMMAR")).thenReturn(true);
        when(courseRepository.existsBySlug("jlpt-n5-foundation")).thenReturn(false);
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course course = invocation.getArgument(0);
            course.setId(UUID.randomUUID());
            return course;
        });

        CourseDraftResponse response = courseService.createDraft(validRequest());

        assertNotNull(response.id());
        assertEquals(CourseStatus.DRAFT, response.status());
        assertEquals("jlpt-n5-foundation", response.slug());
        assertEquals(4, response.learningGoals().size());
        assertEquals("UC-23", response.srsTrace().get("uc"));
        assertTrue(response.srsTrace().toString().contains("BR-GOAL-01"));
        assertTrue(response.srsTrace().toString().contains("BR-COURSE-04"));
        assertTrue(response.srsTrace().toString().contains(MessageCodes.MSG_COURSE_004));

        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(courseCaptor.capture());

        Course savedCourse = courseCaptor.getValue();
        assertEquals(CourseStatus.DRAFT, savedCourse.getStatus());
        assertEquals(approvedTeacher.getId(), savedCourse.getTeacher().getId());
        assertEquals(4, savedCourse.getLearningGoals().size());
        assertTrue(savedCourse.getLearningGoals().stream().allMatch(goal -> goal.getGoalText().length() <= 160));
    }

    @Test
    void createDraft_WhenTitleIsBlank_ShouldAssignDefaultDraftTitle() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseCategoryRepository.existsByCodeAndActiveTrue("GRAMMAR")).thenReturn(true);
        when(courseRepository.existsBySlug(any())).thenReturn(false);
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course course = invocation.getArgument(0);
            course.setId(UUID.randomUUID());
            return course;
        });

        CreateCourseDraftRequest request = new CreateCourseDraftRequest(
                "",
                "Introductory Japanese course for new learners.",
                JlptLevel.N5,
                "GRAMMAR",
                null,
                "Learners can understand basic N5 grammar and vocabulary.",
                BigDecimal.ZERO,
                "No prerequisites",
                "Students starting Japanese from zero",
                List.of(
                        "Read Hiragana and Katakana with confidence",
                        "Understand core N5 sentence patterns",
                        "Use basic greetings and classroom phrases",
                        "Prepare for beginner JLPT N5 practice"
                )
        );

        CourseDraftResponse response = courseService.createDraft(request);

        assertTrue(response.title().startsWith("[Bản nháp] Khóa học chưa đặt tên - "));
        assertTrue(response.slug().startsWith("ban-nhap-khoa-hoc-chua-dat-ten"));
    }

    @Test
    void listMyDrafts_WhenTeacherApproved_ShouldReturnDraftCourses() {
        Course draft = Course.builder()
                .id(UUID.randomUUID())
                .teacher(approvedTeacher)
                .title("JLPT N5 Foundation")
                .slug("jlpt-n5-foundation")
                .introduction("Introductory Japanese course for new learners.")
                .jlptLevel(JlptLevel.N5)
                .category("GRAMMAR")
                .outcomes("Learners can understand basic N5 grammar and vocabulary.")
                .price(BigDecimal.valueOf(100000))
                .currency("VND")
                .prerequisites("No prerequisites")
                .targetStudents("Students starting Japanese from zero")
                .status(CourseStatus.DRAFT)
                .build();
        draft.addLearningGoal("Read Hiragana and Katakana with confidence", 1);

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByTeacher_IdAndStatusOrderByCreatedAtDesc(approvedTeacher.getId(), CourseStatus.DRAFT))
                .thenReturn(List.of(draft));

        List<CourseDraftResponse> responses = courseService.listMyDrafts();

        assertEquals(1, responses.size());
        assertEquals(draft.getId(), responses.get(0).id());
        assertEquals(CourseStatus.DRAFT, responses.get(0).status());
    }

    @Test
    void listMyCourses_WhenTeacherApproved_ShouldIncludeApprovedAndPublishedCourses() {
        Course approvedCourse = Course.builder()
                .id(UUID.randomUUID())
                .teacher(approvedTeacher)
                .title("Approved course")
                .slug("approved-course")
                .status(CourseStatus.APPROVED)
                .build();
        Course publishedCourse = Course.builder()
                .id(UUID.randomUUID())
                .teacher(approvedTeacher)
                .title("Published course")
                .slug("published-course")
                .status(CourseStatus.PUBLISHED)
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByTeacher_IdAndStatusNotOrderByCreatedAtDesc(
                approvedTeacher.getId(),
                CourseStatus.ARCHIVED
        )).thenReturn(List.of(approvedCourse, publishedCourse));

        List<CourseDraftResponse> responses = courseService.listMyCourses();

        assertEquals(2, responses.size());
        assertEquals(CourseStatus.APPROVED, responses.get(0).status());
        assertEquals(CourseStatus.PUBLISHED, responses.get(1).status());
    }

    @Test
    void updateDraft_WhenDraftExists_ShouldUpdateFieldsAndGoals() {
        UUID draftId = UUID.randomUUID();
        Course draft = Course.builder()
                .id(draftId)
                .teacher(approvedTeacher)
                .title("Old title")
                .slug("old-title")
                .introduction("Old introduction")
                .jlptLevel(JlptLevel.N5)
                .category("GRAMMAR")
                .outcomes("Old outcomes")
                .price(BigDecimal.ZERO)
                .currency("VND")
                .prerequisites("Old prerequisites")
                .targetStudents("Old students")
                .status(CourseStatus.DRAFT)
                .build();
        draft.addLearningGoal("Old goal", 1);

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByIdAndTeacher_IdAndStatus(draftId, approvedTeacher.getId(), CourseStatus.DRAFT))
                .thenReturn(Optional.of(draft));
        when(courseCategoryRepository.existsByCodeAndActiveTrue("GRAMMAR")).thenReturn(true);
        when(courseRepository.existsBySlugAndIdNot("jlpt-n5-foundation", draftId)).thenReturn(false);

        CourseDraftResponse response = courseService.updateDraft(draftId, validRequest());

        assertEquals("JLPT N5 Foundation", response.title());
        assertEquals("jlpt-n5-foundation", response.slug());
        assertEquals(4, response.learningGoals().size());
    }

    @Test
    void deleteDraft_WhenDraftExists_ShouldDeleteCourse() {
        UUID draftId = UUID.randomUUID();
        Course draft = Course.builder()
                .id(draftId)
                .teacher(approvedTeacher)
                .title("Draft")
                .slug("draft")
                .status(CourseStatus.DRAFT)
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByIdAndTeacher_IdAndStatus(draftId, approvedTeacher.getId(), CourseStatus.DRAFT))
                .thenReturn(Optional.of(draft));

        courseService.deleteDraft(draftId);

        verify(courseRepository).delete(draft);
    }

    @Test
    void submitForReview_WhenDraftIsValid_ShouldMoveCourseToPending() {
        UUID draftId = UUID.randomUUID();
        Course draft = Course.builder()
                .id(draftId)
                .teacher(approvedTeacher)
                .title("JLPT N5 Foundation")
                .slug("jlpt-n5-foundation")
                .status(CourseStatus.DRAFT)
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByIdAndTeacher_IdAndStatus(
                draftId,
                approvedTeacher.getId(),
                CourseStatus.DRAFT
        )).thenReturn(Optional.of(draft));
        when(courseValidationService.validateCourse(draftId))
                .thenReturn(new ValidationResultResponse(true, List.of()));

        courseService.submitForReview(draftId);

        assertEquals(CourseStatus.PENDING, draft.getStatus());
        assertNotNull(draft.getSubmittedAt());
        verify(notificationService).createNotificationForAdminRole(
                "COURSE_MANAGER",
                "Course submitted for review",
                "Teacher submitted course \"JLPT N5 Foundation\" for review.",
                "COURSE_REVIEW",
                "/admin/courses/approvals/" + draftId
        );
    }

    @Test
    void publishCourse_WhenApprovedAndValid_ShouldPublishAndWriteAudit() {
        UUID courseId = UUID.randomUUID();
        Course approvedCourse = Course.builder()
                .id(courseId)
                .teacher(approvedTeacher)
                .title("JLPT N5 Foundation")
                .slug("jlpt-n5-foundation")
                .status(CourseStatus.APPROVED)
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByIdAndTeacher_Id(courseId, approvedTeacher.getId()))
                .thenReturn(Optional.of(approvedCourse));
        when(courseValidationService.validateCourse(courseId))
                .thenReturn(new ValidationResultResponse(true, List.of()));

        courseService.publishCourse(courseId);

        assertEquals(CourseStatus.PUBLISHED, approvedCourse.getStatus());
        assertNotNull(approvedCourse.getPublishedAt());
        verify(courseRepository).saveAndFlush(approvedCourse);
        verify(auditLogService).logUserAction(
                userId,
                "TEACHER",
                "PUBLISH_COURSE",
                "COURSE",
                courseId,
                Map.of("status", CourseStatus.APPROVED.name()),
                Map.of(
                        "status", CourseStatus.PUBLISHED.name(),
                        "publishedAt", approvedCourse.getPublishedAt().toString()
                ),
                Map.of("courseTitle", approvedCourse.getTitle())
        );
    }

    @Test
    void publishCourse_WhenCourseIsNotApproved_ShouldRejectTransition() {
        UUID courseId = UUID.randomUUID();
        Course pendingCourse = Course.builder()
                .id(courseId)
                .teacher(approvedTeacher)
                .title("Pending course")
                .status(CourseStatus.PENDING)
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseRepository.findByIdAndTeacher_Id(courseId, approvedTeacher.getId()))
                .thenReturn(Optional.of(pendingCourse));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> courseService.publishCourse(courseId)
        );

        assertEquals(MessageCodes.MSG_COURSE_007, exception.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        verify(courseValidationService, never()).validateCourse(courseId);
        verify(courseRepository, never()).saveAndFlush(any());
        verify(auditLogService, never()).logUserAction(
                any(), any(), any(), any(), any(), any(), any(), any()
        );
    }

    @Test
    void createDraft_WhenGoalsAreMissing_ShouldThrowGoalValidationError() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseCategoryRepository.existsByCodeAndActiveTrue("GRAMMAR")).thenReturn(true);

        CreateCourseDraftRequest request = new CreateCourseDraftRequest(
                "JLPT N5 Foundation",
                "Introduction",
                JlptLevel.N5,
                "GRAMMAR",
                null,
                "Outcomes",
                BigDecimal.valueOf(100000),
                "No prerequisites",
                "New learners",
                List.of("Goal 1", "Goal 2", "Goal 3")
        );

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.createDraft(request));

        assertEquals(MessageCodes.MSG_GOAL_001, exception.getMessageCode());
        verify(courseRepository, never()).save(any());
    }

    @Test
    void createDraft_WhenGoalIsTooLong_ShouldThrowGoalLengthError() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(approvedTeacher));
        when(courseCategoryRepository.existsByCodeAndActiveTrue("GRAMMAR")).thenReturn(true);

        String longGoal = "a".repeat(161);
        CreateCourseDraftRequest request = new CreateCourseDraftRequest(
                "JLPT N5 Foundation",
                "Introduction",
                JlptLevel.N5,
                "GRAMMAR",
                null,
                "Outcomes",
                BigDecimal.valueOf(100000),
                "No prerequisites",
                "New learners",
                List.of("Goal 1", "Goal 2", "Goal 3", longGoal)
        );

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.createDraft(request));

        assertEquals(MessageCodes.MSG_GOAL_002, exception.getMessageCode());
        verify(courseRepository, never()).save(any());
    }

    @Test
    void createDraft_WhenTeacherKycIsNotApproved_ShouldThrowForbidden() {
        TeacherProfile pendingTeacher = new TeacherProfile();
        pendingTeacher.setId(UUID.randomUUID());
        pendingTeacher.setKycStatus(TeacherKycStatus.PENDING);
        pendingTeacher.setCanPublishCourse(false);

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(pendingTeacher));

        BusinessException exception = assertThrows(BusinessException.class, () -> courseService.createDraft(validRequest()));

        assertEquals(MessageCodes.MSG_KYC_010, exception.getMessageCode());
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        verify(courseRepository, never()).save(any());
    }

    private CreateCourseDraftRequest validRequest() {
        return new CreateCourseDraftRequest(
                "JLPT N5 Foundation",
                "Introductory Japanese course for new learners.",
                JlptLevel.N5,
                "GRAMMAR",
                "https://cdn.example.com/n5.png",
                "Learners can understand basic N5 grammar and vocabulary.",
                BigDecimal.valueOf(100000),
                "No prerequisites",
                "Students starting Japanese from zero",
                List.of(
                        "Read Hiragana and Katakana with confidence",
                        "Understand core N5 sentence patterns",
                        "Use basic greetings and classroom phrases",
                        "Prepare for beginner JLPT N5 practice"
                )
        );
    }
}
