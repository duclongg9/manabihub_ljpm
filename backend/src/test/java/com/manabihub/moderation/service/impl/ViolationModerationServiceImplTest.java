package com.manabihub.moderation.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.entity.Role;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.enums.RoleCode;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.IdentityTeacherProfileRepository;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.moderation.dto.request.ResolveViolationRequest;
import com.manabihub.moderation.entity.ModerationDecision;
import com.manabihub.moderation.entity.ViolationReport;
import com.manabihub.moderation.enums.ModerationActionType;
import com.manabihub.moderation.enums.ModerationDecisionType;
import com.manabihub.moderation.enums.EvidenceRequestedFrom;
import com.manabihub.moderation.enums.ViolationReportStatus;
import com.manabihub.moderation.event.ModerationNotificationEvent;
import com.manabihub.moderation.repository.ModerationActionRecordRepository;
import com.manabihub.moderation.repository.ModerationDecisionRepository;
import com.manabihub.moderation.repository.ViolationEvidenceRepository;
import com.manabihub.moderation.repository.ViolationReportRepository;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.review.entity.CourseReview;
import com.manabihub.review.enums.CourseReviewStatus;
import com.manabihub.review.repository.CourseReviewRepository;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ViolationModerationServiceImplTest {

    @Mock private ViolationReportRepository reportRepository;
    @Mock private ViolationEvidenceRepository evidenceRepository;
    @Mock private ModerationDecisionRepository decisionRepository;
    @Mock private ModerationActionRecordRepository actionRecordRepository;
    @Mock private InternalAdminAccountRepository adminRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private LessonBlockRepository lessonBlockRepository;
    @Mock private CourseReviewRepository courseReviewRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private IdentityTeacherProfileRepository teacherProfileRepository;
    @Mock private TeacherWalletRepository teacherWalletRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ViolationModerationServiceImpl moderationService;

    private UUID reportId;
    private UUID adminId;
    private UUID teacherProfileId;
    private UUID teacherUserId;
    private UUID courseId;
    private ViolationReport report;
    private InternalAdminAccount admin;
    private AppUser reporterUser;
    private AppUser teacherUser;
    private Course course;
    private TeacherWallet wallet;

    @BeforeEach
    void setUp() {
        reportId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        teacherProfileId = UUID.randomUUID();
        teacherUserId = UUID.randomUUID();
        courseId = UUID.randomUUID();

        teacherUser = AppUser.builder()
                .id(teacherUserId)
                .email("teacher@test.com")
                .fullName("Teacher")
                .userStatus(AccountStatus.ACTIVE)
                .build();
        reporterUser = AppUser.builder()
                .id(UUID.randomUUID())
                .email("reporter@test.com")
                .fullName("Reporter")
                .userStatus(AccountStatus.ACTIVE)
                .build();

        com.manabihub.kyc.domain.AppUser kycUser =
                new com.manabihub.kyc.domain.AppUser();
        kycUser.setId(teacherUserId);
        kycUser.setEmail("teacher@test.com");
        kycUser.setFullName("Teacher");

        TeacherProfile profile = new TeacherProfile();
        profile.setId(teacherProfileId);
        profile.setUser(kycUser);

        course = Course.builder()
                .id(courseId)
                .teacher(profile)
                .title("Japanese N5")
                .status(CourseStatus.PUBLISHED)
                .price(BigDecimal.valueOf(100_000))
                .build();

        report = ViolationReport.builder()
                .id(reportId)
                .reporter(reporterUser)
                .targetType("COURSE")
                .targetId(courseId)
                .reason("Copyright report")
                .status(ViolationReportStatus.PENDING_REVIEW)
                .build();

        Role role = new Role();
        role.setCode(RoleCode.COURSE_MANAGER);
        admin = new InternalAdminAccount();
        admin.setId(adminId);
        admin.setAccountStatus(AccountStatus.ACTIVE);
        admin.setRole(role);

        wallet = new TeacherWallet();
        wallet.setId(UUID.randomUUID());
        wallet.setTeacherId(teacherProfileId);
        wallet.setBalance(BigDecimal.valueOf(5_000_000));
        wallet.setFrozenBalance(BigDecimal.ZERO);
        wallet.setCurrency("VND");
    }

    @Test
    void dismissResolvesWithoutEnforcementAndPublishesReporterNotification() {
        stubResolvePermission();
        stubSuccessfulResolutionReads();
        ResolveViolationRequest request = request(ModerationDecisionType.DISMISSED, List.of());

        moderationService.resolveViolation(reportId, request, adminId);

        assertEquals(ViolationReportStatus.RESOLVED_NO_VIOLATION, report.getStatus());
        verify(courseRepository, never()).save(any());
        verify(teacherWalletRepository, never()).save(any());
        verify(eventPublisher, times(2))
                .publishEvent(any(ModerationNotificationEvent.class));
    }

    @Test
    void upheldForceDraftRemovesCourseFromPublicCatalog() {
        stubResolvePermission();
        when(adminRepository.hasPermission(adminId, "VIOLATION_CONTENT_ENFORCE"))
                .thenReturn(true);
        stubSuccessfulResolutionReads();
        when(courseRepository.findByIdForModeration(courseId)).thenReturn(Optional.of(course));

        moderationService.resolveViolation(
                reportId,
                request(ModerationDecisionType.UPHELD, List.of(ModerationActionType.FORCE_DRAFT)),
                adminId
        );

        assertEquals(CourseStatus.FORCED_DRAFT, course.getStatus());
        verify(courseRepository).save(course);
        verify(eventPublisher, times(2))
                .publishEvent(any(ModerationNotificationEvent.class));
    }

    @Test
    void severeActionsUseUserIdForBanAndTeacherProfileIdForWallet() {
        Role systemRole = new Role();
        systemRole.setCode(RoleCode.SYSTEM_ADMIN);
        admin.setRole(systemRole);
        stubResolvePermission();
        when(adminRepository.hasPermission(adminId, "VIOLATION_SEVERE_ENFORCE"))
                .thenReturn(true);
        stubSuccessfulResolutionReads();
        when(courseRepository.findByIdForModeration(courseId)).thenReturn(Optional.of(course));
        when(appUserRepository.findByIdForUpdate(teacherUserId))
                .thenReturn(Optional.of(teacherUser));
        when(teacherWalletRepository.findByTeacherIdForUpdate(teacherProfileId))
                .thenReturn(Optional.of(wallet));

        moderationService.resolveViolation(
                reportId,
                request(
                        ModerationDecisionType.UPHELD,
                        List.of(
                                ModerationActionType.BAN_ACCOUNT,
                                ModerationActionType.FREEZE_BALANCE
                        )
                ),
                adminId
        );

        assertEquals(AccountStatus.LOCKED, teacherUser.getUserStatus());
        assertTrue(wallet.isFrozen());
        verify(appUserRepository).findByIdForUpdate(teacherUserId);
        verify(teacherWalletRepository).findByTeacherIdForUpdate(teacherProfileId);
    }

    @Test
    void secondResolutionReturnsConflict() {
        stubResolvePermission();
        report.setStatus(ViolationReportStatus.RESOLVED_UPHELD);
        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(report));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> moderationService.resolveViolation(
                        reportId,
                        request(ModerationDecisionType.DISMISSED, List.of()),
                        adminId
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        verify(decisionRepository, never()).save(any());
    }

    @Test
    void dismissedDecisionRejectsClientSuppliedBanAction() {
        stubResolvePermission();
        ResolveViolationRequest request = request(
                ModerationDecisionType.DISMISSED,
                List.of(ModerationActionType.BAN_ACCOUNT)
        );

        assertThrows(
                BusinessException.class,
                () -> moderationService.resolveViolation(reportId, request, adminId)
        );
        verify(reportRepository, never()).findByIdLocked(any());
    }

    @Test
    void upheldDecisionRejectsNoneAction() {
        stubResolvePermission();
        ResolveViolationRequest request = request(
                ModerationDecisionType.UPHELD,
                List.of(ModerationActionType.NONE)
        );

        assertThrows(
                BusinessException.class,
                () -> moderationService.resolveViolation(reportId, request, adminId)
        );
        verify(reportRepository, never()).findByIdLocked(any());
    }

    @Test
    void courseManagerCannotApplySevereActionWithoutPermission() {
        stubResolvePermission();
        stubDecisionSave();
        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(report));
        when(courseRepository.findByIdForModeration(courseId)).thenReturn(Optional.of(course));
        when(appUserRepository.findById(teacherUserId)).thenReturn(Optional.of(teacherUser));
        when(adminRepository.hasPermission(adminId, "VIOLATION_SEVERE_ENFORCE"))
                .thenReturn(false);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> moderationService.resolveViolation(
                        reportId,
                        request(
                                ModerationDecisionType.UPHELD,
                                List.of(ModerationActionType.BAN_ACCOUNT)
                        ),
                        adminId
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        verify(appUserRepository, never()).save(any());
        verify(reportRepository, never()).save(any());
    }

    @Test
    void missingDecisionNoteDoesNotLockOrMutateReport() {
        stubResolvePermission();
        ResolveViolationRequest request = request(ModerationDecisionType.DISMISSED, List.of());
        request.setDecisionNote("   ");

        assertThrows(
                BusinessException.class,
                () -> moderationService.resolveViolation(reportId, request, adminId)
        );
        verify(reportRepository, never()).findByIdLocked(any());
    }

    @Test
    void pendingEvidenceDoesNotApplySevereActionAndNotifiesReporter() {
        stubResolvePermission();
        stubSuccessfulResolutionReads();
        when(courseRepository.findByIdForModeration(courseId)).thenReturn(Optional.of(course));
        ResolveViolationRequest request =
                request(ModerationDecisionType.PENDING_EVIDENCE, List.of());
        request.setEvidenceRequestedFrom(EvidenceRequestedFrom.REPORTER);

        moderationService.resolveViolation(
                reportId,
                request,
                adminId
        );

        assertEquals(ViolationReportStatus.PENDING_EVIDENCE, report.getStatus());
        verify(appUserRepository, never()).save(any());
        verify(teacherWalletRepository, never()).save(any());
        verify(eventPublisher).publishEvent(any(ModerationNotificationEvent.class));
    }

    @Test
    void userReportCannotBeUsedToRemoveArbitraryCourseContent() {
        report.setTargetType("USER");
        report.setTargetId(teacherUserId);
        stubResolvePermission();
        when(adminRepository.hasPermission(adminId, "VIOLATION_CONTENT_ENFORCE"))
                .thenReturn(true);
        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(report));
        stubDecisionSave();
        when(appUserRepository.findByIdForUpdate(teacherUserId))
                .thenReturn(Optional.of(teacherUser));
        when(teacherProfileRepository.findByUser_Id(teacherUserId))
                .thenReturn(Optional.empty());
        ResolveViolationRequest request = request(
                ModerationDecisionType.UPHELD,
                List.of(ModerationActionType.REMOVE_CONTENT)
        );
        request.setTargetIds(List.of(UUID.randomUUID()));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> moderationService.resolveViolation(reportId, request, adminId)
        );

        assertEquals(MessageCodes.MODERATION_INVALID_ACTION, exception.getMessageCode());
        verify(lessonBlockRepository, never()).findByIdForModeration(any());
        verify(courseReviewRepository, never()).findByIdForModeration(any());
    }

    @Test
    void removingReportedReviewHidesOnlyReviewAndNotifiesReporterAndAuthor() {
        CourseReview review = reviewBy(newReviewAuthor());
        report.setTargetType("REVIEW");
        report.setTargetId(review.getId());
        stubResolvePermission();
        when(adminRepository.hasPermission(adminId, "VIOLATION_CONTENT_ENFORCE"))
                .thenReturn(true);
        stubSuccessfulReviewResolutionReads(review);

        moderationService.resolveViolation(
                reportId,
                request(
                        ModerationDecisionType.UPHELD,
                        List.of(ModerationActionType.REMOVE_CONTENT)
                ),
                adminId
        );

        assertEquals(CourseReviewStatus.HIDDEN, review.getStatus());
        assertEquals(CourseStatus.PUBLISHED, course.getStatus());
        verify(courseRepository, never()).save(any());
        verify(courseReviewRepository).save(review);

        ArgumentCaptor<ModerationNotificationEvent> eventCaptor =
                ArgumentCaptor.forClass(ModerationNotificationEvent.class);
        verify(eventPublisher, times(2)).publishEvent(eventCaptor.capture());
        Set<UUID> recipientIds = eventCaptor.getAllValues().stream()
                .map(ModerationNotificationEvent::recipientUserId)
                .collect(java.util.stream.Collectors.toSet());
        assertEquals(
                Set.of(reporterUser.getId(), review.getEnrollment().getStudent().getUser().getId()),
                recipientIds
        );
        assertFalse(recipientIds.contains(teacherUserId));
    }

    @Test
    void banningReportedReviewLocksAuthorInsteadOfCourseTeacher() {
        AppUser reviewAuthor = newReviewAuthor();
        CourseReview review = reviewBy(reviewAuthor);
        report.setTargetType("REVIEW");
        report.setTargetId(review.getId());
        stubResolvePermission();
        when(adminRepository.hasPermission(adminId, "VIOLATION_SEVERE_ENFORCE"))
                .thenReturn(true);
        stubSuccessfulReviewResolutionReads(review);
        when(appUserRepository.findByIdForUpdate(reviewAuthor.getId()))
                .thenReturn(Optional.of(reviewAuthor));

        moderationService.resolveViolation(
                reportId,
                request(
                        ModerationDecisionType.UPHELD,
                        List.of(ModerationActionType.BAN_ACCOUNT)
                ),
                adminId
        );

        assertEquals(AccountStatus.LOCKED, reviewAuthor.getUserStatus());
        assertEquals(AccountStatus.ACTIVE, teacherUser.getUserStatus());
        verify(appUserRepository).findByIdForUpdate(reviewAuthor.getId());
        verify(appUserRepository, never()).findByIdForUpdate(teacherUserId);
        verify(teacherWalletRepository, never()).findByTeacherIdForUpdate(any());
    }

    @Test
    void outcomeNotificationIsDeduplicatedWhenReporterIsAffectedUser() {
        report.setReporter(teacherUser);
        stubResolvePermission();
        stubSuccessfulResolutionReads();

        moderationService.resolveViolation(
                reportId,
                request(ModerationDecisionType.DISMISSED, List.of()),
                adminId
        );

        verify(eventPublisher).publishEvent(any(ModerationNotificationEvent.class));
    }

    private void stubResolvePermission() {
        when(adminRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(adminRepository.hasPermission(adminId, "VIOLATION_RESOLVE")).thenReturn(true);
    }

    private void stubSuccessfulResolutionReads() {
        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(ViolationReport.class))).thenAnswer(invocation -> invocation.getArgument(0));
        stubDecisionSave();
        when(actionRecordRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(evidenceRepository.findByViolationReport_IdOrderByCreatedAtAsc(reportId))
                .thenReturn(List.of());
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(appUserRepository.findById(teacherUserId)).thenReturn(Optional.of(teacherUser));
        when(decisionRepository.findByViolationReportIdOrderByCreatedAtDesc(reportId))
                .thenReturn(Collections.emptyList());
        when(orderItemRepository.countPaidPurchasersByCourseId(courseId)).thenReturn(0L);
        when(reportRepository.countByTargetTypeIgnoreCaseAndTargetIdAndStatus(
                "COURSE",
                courseId,
                ViolationReportStatus.RESOLVED_UPHELD
        )).thenReturn(0L);
    }

    private void stubSuccessfulReviewResolutionReads(CourseReview review) {
        when(reportRepository.findByIdLocked(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(ViolationReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        stubDecisionSave();
        when(actionRecordRepository.saveAll(anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(evidenceRepository.findByViolationReport_IdOrderByCreatedAtAsc(reportId))
                .thenReturn(List.of());
        when(courseReviewRepository.findByIdForModeration(review.getId()))
                .thenReturn(Optional.of(review));
        when(courseReviewRepository.findById(review.getId())).thenReturn(Optional.of(review));
        when(decisionRepository.findByViolationReportIdOrderByCreatedAtDesc(reportId))
                .thenReturn(Collections.emptyList());
        when(orderItemRepository.countPaidPurchasersByCourseId(courseId)).thenReturn(0L);
        when(reportRepository.countByTargetTypeIgnoreCaseAndTargetIdAndStatus(
                "REVIEW",
                review.getId(),
                ViolationReportStatus.RESOLVED_UPHELD
        )).thenReturn(0L);
    }

    private AppUser newReviewAuthor() {
        return AppUser.builder()
                .id(UUID.randomUUID())
                .email("reviewer@test.com")
                .fullName("Review Author")
                .userStatus(AccountStatus.ACTIVE)
                .build();
    }

    private CourseReview reviewBy(AppUser reviewAuthor) {
        StudentProfile student = StudentProfile.builder()
                .id(UUID.randomUUID())
                .user(reviewAuthor)
                .build();
        Enrollment enrollment = Enrollment.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .build();
        return CourseReview.builder()
                .id(UUID.randomUUID())
                .enrollment(enrollment)
                .rating(1)
                .reviewText("Reported review")
                .status(CourseReviewStatus.APPROVED)
                .build();
    }

    private void stubDecisionSave() {
        when(decisionRepository.save(any(ModerationDecision.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private ResolveViolationRequest request(
            ModerationDecisionType decision,
            List<ModerationActionType> actions
    ) {
        ResolveViolationRequest request = new ResolveViolationRequest();
        request.setDecision(decision);
        request.setDecisionNote("Documented moderation reason");
        request.setActions(actions);
        return request;
    }
}
