package com.manabihub.course.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.course.dto.request.CourseReviewRequest;
import com.manabihub.course.dto.response.CourseApprovalDetailResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseApprovalDecision;
import com.manabihub.course.enums.CourseApprovalDecisionEnum;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseApprovalDecisionRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class AdminCourseApprovalServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseApprovalDecisionRepository decisionRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AdminCourseApprovalServiceImpl courseApprovalService;

    private UUID adminId;
    private UUID courseId;
    private UUID teacherUserId;
    private Course course;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        courseId = UUID.randomUUID();
        teacherUserId = UUID.randomUUID();

        AppUser teacherUser = new AppUser();
        teacherUser.setId(teacherUserId);
        teacherUser.setEmail("teacher@manabihub.local");
        teacherUser.setFullName("Teacher");

        TeacherProfile teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(teacherUser);

        course = Course.builder()
                .id(courseId)
                .teacher(teacher)
                .title("N5 for beginners")
                .status(CourseStatus.PENDING)
                .build();

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
    }

    @Test
    void getDetail_DoesNotFabricateCopyrightAgreementEvidence() {
        mockCourseManagerAccess();

        CourseApprovalDetailResponse detail = courseApprovalService.getDetail(adminId, courseId);

        assertNull(detail.getPolicyEvidence());
    }

    @Test
    void reviewCourse_RecordsSystemAdminRoleWhenSystemAdminMakesDecision() {
        when(courseRepository.hasAdminRole(adminId, List.of("SYSTEM_ADMIN"))).thenReturn(true);
        CourseReviewRequest request = CourseReviewRequest.builder()
                .action("APPROVE")
                .build();

        courseApprovalService.reviewCourse(adminId, courseId, request);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        assertEquals("SYSTEM_ADMIN", auditCaptor.getValue().getActorRoleCode());
    }

    @ParameterizedTest
    @CsvSource({
            "APPROVE,,APPROVED,APPROVED,COURSE_APPROVED",
            "REJECT,Missing evidence,REJECTED,REJECTED,COURSE_REJECTED",
            "REQUEST_CORRECTION,Fix lesson content,DRAFT,CORRECTION_REQUIRED,COURSE_CORRECTION_REQUESTED"
    })
    void reviewCourse_ShouldWriteDatabaseCompatibleInternalAdminAudit(
            String action,
            String reason,
            CourseStatus expectedStatus,
            CourseApprovalDecisionEnum expectedDecision,
            String expectedAuditAction
    ) {
        mockCourseManagerAccess();
        CourseReviewRequest request = CourseReviewRequest.builder()
                .action(action)
                .reason(reason)
                .build();

        courseApprovalService.reviewCourse(adminId, courseId, request);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        AuditLog auditLog = auditCaptor.getValue();

        assertEquals("INTERNAL_ADMIN", auditLog.getActorType());
        assertEquals(adminId, auditLog.getActorAdminId());
        assertEquals("COURSE_MANAGER", auditLog.getActorRoleCode());
        assertEquals(expectedAuditAction, auditLog.getAction());
        assertEquals("COURSE", auditLog.getTargetType());
        assertEquals(courseId, auditLog.getTargetId());
        assertEquals("PENDING", auditLog.getBeforeValue().get("status"));
        assertEquals(expectedStatus.name(), auditLog.getAfterValue().get("status"));

        ArgumentCaptor<CourseApprovalDecision> decisionCaptor =
                ArgumentCaptor.forClass(CourseApprovalDecision.class);
        verify(decisionRepository).save(decisionCaptor.capture());
        assertEquals(expectedDecision, decisionCaptor.getValue().getDecision());

        verify(notificationService).createNotification(
                eq(teacherUserId),
                eq("teacher@manabihub.local"),
                anyString(),
                anyString(),
                eq("COURSE_APPROVAL"),
                eq("/teacher/courses")
        );
        assertEquals(expectedStatus, course.getStatus());
    }

    private void mockCourseManagerAccess() {
        when(courseRepository.hasAdminRole(adminId, List.of("SYSTEM_ADMIN"))).thenReturn(false);
        when(courseRepository.hasAdminRole(adminId, List.of("COURSE_MANAGER"))).thenReturn(true);
    }
}
