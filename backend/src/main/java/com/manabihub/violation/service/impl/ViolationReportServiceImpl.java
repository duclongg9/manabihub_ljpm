package com.manabihub.violation.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.review.entity.CourseReview;
import com.manabihub.violation.dto.ViolationReportRequest;
import com.manabihub.violation.dto.ViolationReportResponse;
import com.manabihub.violation.entity.ViolationReport;
import com.manabihub.violation.enums.ViolationStatus;
import com.manabihub.violation.enums.ViolationTargetType;
import com.manabihub.violation.mapper.ViolationReportMapper;
import com.manabihub.violation.repository.ViolationReportRepository;
import com.manabihub.violation.service.ViolationReportService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ViolationReportServiceImpl implements ViolationReportService {

    private final ViolationReportRepository violationReportRepository;
    private final ViolationReportMapper violationReportMapper;
    private final NotificationService notificationService;
    private final EntityManager entityManager;

    @Value("${manabihub.violation.spam-window-minutes:60}")
    private int spamWindowMinutes;

    @Override
    @Transactional
    public ViolationReportResponse submitReport(ViolationReportRequest request, UUID reporterId) {
        if (request.getTargetType() != ViolationTargetType.COURSE && request.getTargetType() != ViolationTargetType.LESSON_BLOCK) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "Only COURSE and LESSON_BLOCK targets can be reported via this API.");
        }

        boolean targetExists = checkTargetExists(request.getTargetType(), request.getTargetId());
        if (!targetExists) {
            throw new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Target not found");
        }

        // Lock the user row to prevent concurrent duplicate/spam submissions
        AppUser reporter = entityManager.find(AppUser.class, reporterId, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (reporter == null) {
            throw new BusinessException(MessageCodes.AUTH_UNAUTHORIZED, "Reporter not found");
        }

        Instant timeWindowStart = Instant.now().minus(spamWindowMinutes, ChronoUnit.MINUTES);
        boolean isDuplicate = violationReportRepository.isDuplicateReport(
                reporterId,
                request.getTargetType(),
                request.getTargetId(),
                timeWindowStart);

        if (isDuplicate) {
            throw new BusinessException(MessageCodes.MSG_REP_002, "Duplicate report detected");
        }

        ViolationReport report = ViolationReport.builder()
                .reporter(reporter)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .status(ViolationStatus.PENDING)
                .build();

        report = violationReportRepository.save(report);

        // Course Manager owns the standard moderation queue and VIOLATION_RESOLVE permission.
        notificationService.createNotificationForAdminRole(
                "COURSE_MANAGER",
                "New Violation Report",
                "A new report has been submitted against " + request.getTargetType() + " " + request.getTargetId(),
                "VIOLATION_REPORT",
                "/admin/violations/" + report.getId()
        );

        return violationReportMapper.toResponse(report);
    }

    private boolean checkTargetExists(ViolationTargetType type, UUID targetId) {
        Class<?> entityClass = switch (type) {
            case COURSE -> Course.class;
            case LESSON, LESSON_BLOCK -> LessonBlock.class;
            case REVIEW -> CourseReview.class;
            case USER -> AppUser.class;
        };
        return entityManager.find(entityClass, targetId) != null;
    }
}
