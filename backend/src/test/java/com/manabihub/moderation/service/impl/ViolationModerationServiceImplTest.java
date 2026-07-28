package com.manabihub.moderation.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.moderation.dto.request.ResolveViolationRequest;
import com.manabihub.moderation.dto.response.ViolationDetailResponse;
import com.manabihub.moderation.entity.ModerationDecision;
import com.manabihub.moderation.entity.ViolationReport;
import com.manabihub.moderation.enums.ModerationActionType;
import com.manabihub.moderation.enums.ModerationDecisionType;
import com.manabihub.moderation.enums.ViolationReportStatus;
import com.manabihub.moderation.repository.ModerationActionRecordRepository;
import com.manabihub.moderation.repository.ModerationDecisionRepository;
import com.manabihub.moderation.repository.ViolationReportRepository;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ViolationModerationServiceImplTest {

    @Mock
    private ViolationReportRepository reportRepository;
    @Mock
    private ModerationDecisionRepository decisionRepository;
    @Mock
    private ModerationActionRecordRepository actionRecordRepository;
    @Mock
    private InternalAdminAccountRepository adminRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private AppUserRepository appUserRepository;
    @Mock
    private TeacherWalletRepository teacherWalletRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ViolationModerationServiceImpl moderationService;

    private UUID reportId;
    private UUID adminId;
    private UUID teacherId;
    private UUID courseId;
    private ViolationReport mockReport;
    private InternalAdminAccount mockAdmin;
    private AppUser mockTeacher;
    private Course mockCourse;
    private TeacherWallet mockWallet;

    @BeforeEach
    void setUp() {
        reportId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        teacherId = UUID.randomUUID();
        courseId = UUID.randomUUID();

        mockReport = new ViolationReport();
        mockReport.setId(reportId);
        mockReport.setStatus(ViolationReportStatus.PENDING_REVIEW);
        mockReport.setTargetType("COURSE");
        mockReport.setTargetId(courseId);

        mockAdmin = new InternalAdminAccount();
        mockAdmin.setId(adminId);

        mockTeacher = new AppUser();
        mockTeacher.setId(teacherId);
        mockTeacher.setEmail("teacher@test.com");
        mockTeacher.setUserStatus(AccountStatus.ACTIVE);

        mockCourse = new Course();
        mockCourse.setId(courseId);
        com.manabihub.kyc.domain.TeacherProfile teacherProfile = new com.manabihub.kyc.domain.TeacherProfile();
        teacherProfile.setId(teacherId);
        mockCourse.setTeacher(teacherProfile);
        mockCourse.setStatus(CourseStatus.PUBLISHED);

        mockWallet = new TeacherWallet();
        mockWallet.setId(UUID.randomUUID());
        mockWallet.setTeacherId(teacherId);
        mockWallet.setFrozen(false);
    }

    @Test
    void resolveViolation_DismissNoViolation() {
        ResolveViolationRequest request = new ResolveViolationRequest();
        request.setDecision(ModerationDecisionType.DISMISSED);
        request.setDecisionNote("No clear violation found.");

        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(mockReport));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(mockReport));
        when(adminRepository.findById(adminId)).thenReturn(Optional.of(mockAdmin));
        
        ModerationDecision mockDecision = new ModerationDecision();
        mockDecision.setId(UUID.randomUUID());
        mockDecision.setDecisionType(ModerationDecisionType.DISMISSED);
        when(decisionRepository.save(any(ModerationDecision.class))).thenReturn(mockDecision);
        when(decisionRepository.findByViolationReportIdOrderByCreatedAtDesc(reportId))
                .thenReturn(Collections.singletonList(mockDecision));

        ViolationDetailResponse response = moderationService.resolveViolation(reportId, request, adminId);

        assertEquals(ViolationReportStatus.RESOLVED_NO_VIOLATION, mockReport.getStatus());
        verify(actionRecordRepository).saveAll(any());
        verify(reportRepository).save(mockReport);
        verify(auditLogService).logAdminAction(eq(adminId), anyString(), anyString(), anyString(), any(UUID.class), anyMap(), anyMap(), anyMap());
    }

    @Test
    void resolveViolation_Upheld_ForceDraft() {
        ResolveViolationRequest request = new ResolveViolationRequest();
        request.setDecision(ModerationDecisionType.UPHELD);
        request.setDecisionNote("Copyright infringement.");
        request.setActions(List.of(ModerationActionType.FORCE_DRAFT));

        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(mockReport));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(mockReport));
        when(adminRepository.findById(adminId)).thenReturn(Optional.of(mockAdmin));
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(mockCourse));
        when(appUserRepository.findById(teacherId)).thenReturn(Optional.of(mockTeacher));

        ModerationDecision mockDecision = new ModerationDecision();
        mockDecision.setId(UUID.randomUUID());
        mockDecision.setDecisionType(ModerationDecisionType.UPHELD);
        when(decisionRepository.save(any(ModerationDecision.class))).thenReturn(mockDecision);
        when(decisionRepository.findByViolationReportIdOrderByCreatedAtDesc(reportId))
                .thenReturn(Collections.singletonList(mockDecision));

        moderationService.resolveViolation(reportId, request, adminId);

        assertEquals(CourseStatus.FORCED_DRAFT, mockCourse.getStatus());
        verify(courseRepository).save(mockCourse);
        verify(notificationService).createNotification(eq(teacherId), eq("teacher@test.com"), anyString(), anyString(), eq("VIOLATION_UPHELD"));
    }

    @Test
    void resolveViolation_Upheld_BanTeacherAndFreezeBalance() {
        ResolveViolationRequest request = new ResolveViolationRequest();
        request.setDecision(ModerationDecisionType.UPHELD);
        request.setDecisionNote("Severe violation.");
        request.setActions(List.of(ModerationActionType.BAN_ACCOUNT, ModerationActionType.FREEZE_BALANCE));

        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(mockReport));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(mockReport));
        when(adminRepository.findById(adminId)).thenReturn(Optional.of(mockAdmin));
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(mockCourse));
        when(appUserRepository.findById(teacherId)).thenReturn(Optional.of(mockTeacher));
        when(teacherWalletRepository.findByTeacherId(teacherId)).thenReturn(Optional.of(mockWallet));

        ModerationDecision mockDecision = new ModerationDecision();
        mockDecision.setId(UUID.randomUUID());
        mockDecision.setDecisionType(ModerationDecisionType.UPHELD);
        when(decisionRepository.save(any(ModerationDecision.class))).thenReturn(mockDecision);
        when(decisionRepository.findByViolationReportIdOrderByCreatedAtDesc(reportId))
                .thenReturn(Collections.singletonList(mockDecision));

        moderationService.resolveViolation(reportId, request, adminId);

        assertEquals(AccountStatus.LOCKED, mockTeacher.getUserStatus());
        assertTrue(mockWallet.isFrozen());
        
        verify(appUserRepository).save(mockTeacher);
        verify(teacherWalletRepository).save(mockWallet);
    }
    
    @Test
    void resolveViolation_AlreadyResolved_ThrowsException() {
        mockReport.setStatus(ViolationReportStatus.RESOLVED_UPHELD);
        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(mockReport));
        
        ResolveViolationRequest request = new ResolveViolationRequest();
        
        assertThrows(BusinessException.class, () -> moderationService.resolveViolation(reportId, request, adminId));
    }
}
