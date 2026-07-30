package com.manabihub.course.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.request.CourseReviewRequest;
import com.manabihub.course.dto.response.CourseApprovalDetailResponse;
import com.manabihub.course.dto.response.CourseApprovalQueueResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseApprovalDecision;
import com.manabihub.course.enums.CourseApprovalDecisionEnum;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseApprovalDecisionRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.AdminCourseApprovalService;
import com.manabihub.notification.entity.Notification;
import com.manabihub.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCourseApprovalServiceImpl implements AdminCourseApprovalService {

    private final CourseRepository courseRepository;
    private final CourseApprovalDecisionRepository decisionRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    private void checkCourseManagerAccess(UUID adminId) {
        boolean hasAccess = courseRepository.hasAdminRole(adminId, List.of("SYSTEM_ADMIN", "COURSE_MANAGER"));
        if (!hasAccess) {
            throw new BusinessException(MessageCodes.ADMIN_PERMISSION_DENIED,
                    "Access denied: Course Manager or Super Admin privileges required");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseApprovalQueueResponse> getQueue(UUID adminId) {
        checkCourseManagerAccess(adminId);
        List<Course> courses = courseRepository.findAllByStatusOrderBySubmittedAtAsc(CourseStatus.PENDING);
        return courses.stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CourseApprovalDetailResponse getDetail(UUID adminId, UUID courseId) {
        checkCourseManagerAccess(adminId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException("MSG-COM-001", "Course not found"));

        int lessonBlocksCount = courseRepository.countLessonBlocksByCourseId(courseId);
        boolean finalTestIncluded = courseRepository.hasFinalTestByCourseId(courseId);

        return CourseApprovalDetailResponse.builder()
                .id(course.getId())
                .courseName(course.getTitle())
                .teacherName(course.getTeacher().getUser().getFullName())
                .teacherEmail(course.getTeacher().getUser().getEmail())
                .submittedAt(course.getSubmittedAt())
                .status(course.getStatus())
                .curriculumSummary(course.getDescription())
                .lessonBlocksCount(lessonBlocksCount)
                .finalTestIncluded(finalTestIncluded)
                .policyEvidence("Digital Copyright Liability Agreement accepted upon course submission at " + course.getSubmittedAt())
                .build();
    }

    @Override
    @Transactional
    public void reviewCourse(UUID adminId, UUID courseId, CourseReviewRequest request) {
        checkCourseManagerAccess(adminId);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException("MSG-COM-001", "Course not found"));

        if (course.getStatus() != CourseStatus.PENDING) {
            throw new BusinessException("MSG-COM-004", "Course is not in PENDING state");
        }

        CourseStatus oldStatus = course.getStatus();
        CourseApprovalDecisionEnum decisionEnum;
        String actionLog;
        String notificationMessage;

        switch (request.getAction().toUpperCase()) {
            case "APPROVE":
                course.setStatus(CourseStatus.APPROVED);
                course.setApprovedBy(adminId);
                course.setApprovedAt(Instant.now());
                course.setRejectionReason(null);
                decisionEnum = CourseApprovalDecisionEnum.APPROVED;
                actionLog = "COURSE_APPROVED";
                notificationMessage = "Your course '" + course.getTitle()
                        + "' has been approved and is ready to be published.";
                break;
            case "REJECT":
                if (request.getReason() == null || request.getReason().isBlank()) {
                    throw new BusinessException("MSG-COM-002", "Reason is required for rejection");
                }
                course.setStatus(CourseStatus.REJECTED);
                course.setRejectionReason(request.getReason());
                decisionEnum = CourseApprovalDecisionEnum.REJECTED;
                actionLog = "COURSE_REJECTED";
                notificationMessage = "Your course '" + course.getTitle() + "' has been rejected. Reason: "
                        + request.getReason();
                break;
            case "REQUEST_CORRECTION":
                if (request.getReason() == null || request.getReason().isBlank()) {
                    throw new BusinessException("MSG-COM-002", "Reason is required for correction request");
                }
                course.setStatus(CourseStatus.DRAFT);
                course.setRejectionReason(request.getReason());
                decisionEnum = CourseApprovalDecisionEnum.CORRECTION_REQUIRED;
                actionLog = "COURSE_CORRECTION_REQUESTED";
                notificationMessage = "Your course '" + course.getTitle()
                        + "' requires corrections before approval. Reason: " + request.getReason();
                break;
            default:
                throw new BusinessException("MSG-COM-004", "Invalid action");
        }

        courseRepository.save(course);

        // Save Decision Record
        CourseApprovalDecision decision = CourseApprovalDecision.builder()
                .courseId(course.getId())
                .decidedBy(adminId)
                .decision(decisionEnum)
                .reason(request.getReason())
                .build();
        decisionRepository.save(decision);

        // Create Notification
        Notification notification = Notification.builder()
                .recipientUserId(course.getTeacher().getUser().getId())
                .title("Course Review Update")
                .message(notificationMessage)
                .notificationType("COURSE_APPROVAL")
                .actionUrl("/teacher/courses/" + course.getId())
                .build();
        notificationRepository.save(notification);

        // Create Audit Log
        Map<String, Object> metadata = null;
        if (request.getReason() != null && !request.getReason().isBlank()) {
            metadata = Map.of("reason", request.getReason());
        }

        AuditLog auditLog = AuditLog.builder()
                .actorType("INTERNAL_ADMIN")
                .actorAdminId(adminId)
                .actorRoleCode("COURSE_MANAGER")
                .action(actionLog)
                .targetType("COURSE")
                .targetId(course.getId())
                .beforeValue(Map.of("status", oldStatus.name()))
                .afterValue(Map.of("status", course.getStatus().name()))
                .metadata(metadata)
                .build();
        auditLogRepository.save(auditLog);
    }

    private CourseApprovalQueueResponse mapToQueueResponse(Course course) {
        return CourseApprovalQueueResponse.builder()
                .id(course.getId())
                .courseName(course.getTitle())
                .teacherName(course.getTeacher().getUser().getFullName())
                .teacherEmail(course.getTeacher().getUser().getEmail())
                .submittedAt(course.getSubmittedAt())
                .status(course.getStatus())
                .build();
    }
}
