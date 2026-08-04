package com.manabihub.violation.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.violation.dto.ViolationReportRequest;
import com.manabihub.violation.dto.ViolationReportResponse;
import com.manabihub.violation.entity.ViolationReport;
import com.manabihub.violation.enums.ViolationTargetType;
import com.manabihub.violation.mapper.ViolationReportMapper;
import com.manabihub.violation.repository.ViolationReportRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ViolationReportServiceImplTest {

    @Mock
    private ViolationReportRepository violationReportRepository;

    @Mock
    private ViolationReportMapper violationReportMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private ViolationReportServiceImpl violationReportService;

    @Test
    void submitReport_CreatesNotificationWithRoutableAdminActionUrl() {
        ReflectionTestUtils.setField(violationReportService, "spamWindowMinutes", 60);

        UUID reporterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        UUID reportId = UUID.randomUUID();
        AppUser reporter = AppUser.builder().id(reporterId).build();

        ViolationReportRequest request = new ViolationReportRequest();
        request.setTargetType(ViolationTargetType.COURSE);
        request.setTargetId(targetId);
        request.setReason("Misleading course content");

        when(entityManager.find(Course.class, targetId)).thenReturn(new Course());
        when(entityManager.find(AppUser.class, reporterId, LockModeType.PESSIMISTIC_WRITE))
                .thenReturn(reporter);
        when(violationReportRepository.isDuplicateReport(
                eq(reporterId),
                eq(ViolationTargetType.COURSE),
                eq(targetId),
                any(Instant.class)
        )).thenReturn(false);
        when(violationReportRepository.save(any(ViolationReport.class)))
                .thenAnswer(invocation -> {
                    ViolationReport saved = invocation.getArgument(0);
                    saved.setId(reportId);
                    return saved;
                });
        when(violationReportMapper.toResponse(any(ViolationReport.class)))
                .thenReturn(new ViolationReportResponse());

        violationReportService.submitReport(request, reporterId);

        verify(notificationService).createNotificationForAdminRole(
                eq("COURSE_MANAGER"),
                eq("Có báo cáo vi phạm mới"),
                contains(targetId.toString()),
                eq("VIOLATION_REPORT"),
                eq("/admin/violations/" + reportId)
        );
    }
}
