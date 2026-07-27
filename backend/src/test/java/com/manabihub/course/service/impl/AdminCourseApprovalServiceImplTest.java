package com.manabihub.course.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.response.CourseApprovalQueueResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseApprovalDecisionRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminCourseApprovalServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseApprovalDecisionRepository decisionRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationRepository notificationRepository;

    private AdminCourseApprovalServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminCourseApprovalServiceImpl(
                courseRepository,
                decisionRepository,
                auditLogRepository,
                notificationRepository,
                new ObjectMapper()
        );
    }

    @Test
    void getQueue_ShouldReturnOnlyPendingCoursesInRepositoryOrder() {
        UUID adminId = UUID.randomUUID();
        Course first = pendingCourse("First submission", Instant.parse("2026-07-27T01:00:00Z"));
        Course second = pendingCourse("Second submission", Instant.parse("2026-07-27T02:00:00Z"));

        when(courseRepository.hasAdminRole(
                adminId,
                List.of("SYSTEM_ADMIN", "COURSE_MANAGER")
        )).thenReturn(true);
        when(courseRepository.findAllByStatusOrderBySubmittedAtAsc(CourseStatus.PENDING))
                .thenReturn(List.of(first, second));

        List<CourseApprovalQueueResponse> queue = service.getQueue(adminId);

        assertEquals(List.of(first.getId(), second.getId()),
                queue.stream().map(CourseApprovalQueueResponse::getId).toList());
        assertEquals(List.of(CourseStatus.PENDING, CourseStatus.PENDING),
                queue.stream().map(CourseApprovalQueueResponse::getStatus).toList());
        verify(courseRepository).findAllByStatusOrderBySubmittedAtAsc(CourseStatus.PENDING);
    }

    @Test
    void getQueue_WhenAdminLacksCourseManagerRole_ShouldBeDenied() {
        UUID adminId = UUID.randomUUID();
        when(courseRepository.hasAdminRole(
                adminId,
                List.of("SYSTEM_ADMIN", "COURSE_MANAGER")
        )).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.getQueue(adminId));

        assertEquals(MessageCodes.ADMIN_PERMISSION_DENIED, exception.getMessageCode());
    }

    private Course pendingCourse(String title, Instant submittedAt) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Teacher");
        user.setEmail("teacher@example.com");

        TeacherProfile teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(user);

        return Course.builder()
                .id(UUID.randomUUID())
                .teacher(teacher)
                .title(title)
                .slug(UUID.randomUUID().toString())
                .status(CourseStatus.PENDING)
                .submittedAt(submittedAt)
                .build();
    }
}
