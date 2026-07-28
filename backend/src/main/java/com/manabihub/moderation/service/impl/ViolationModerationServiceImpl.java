package com.manabihub.moderation.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.constants.MessageCodes;
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
import com.manabihub.moderation.dto.response.ViolationQueueItemResponse;
import com.manabihub.moderation.entity.ModerationActionRecord;
import com.manabihub.moderation.entity.ModerationDecision;
import com.manabihub.moderation.entity.ViolationReport;
import com.manabihub.moderation.enums.ModerationActionType;
import com.manabihub.moderation.enums.ModerationDecisionType;
import com.manabihub.moderation.enums.ViolationReportStatus;
import com.manabihub.moderation.repository.ModerationActionRecordRepository;
import com.manabihub.moderation.repository.ModerationDecisionRepository;
import com.manabihub.moderation.repository.ViolationReportRepository;
import com.manabihub.moderation.service.ViolationModerationService;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ViolationModerationServiceImpl implements ViolationModerationService {

    private final ViolationReportRepository reportRepository;
    private final ModerationDecisionRepository decisionRepository;
    private final ModerationActionRecordRepository actionRecordRepository;
    private final InternalAdminAccountRepository adminRepository;
    private final CourseRepository courseRepository;
    private final AppUserRepository appUserRepository;
    private final TeacherWalletRepository teacherWalletRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<ViolationQueueItemResponse> getViolationQueue(String statusStr, Pageable pageable) {
        ViolationReportStatus status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            try {
                status = ViolationReportStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }
        
        Page<ViolationReport> reports;
        if (status != null) {
            reports = reportRepository.findByStatus(status, pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }
        
        return reports.map(r -> ViolationQueueItemResponse.builder()
                .reportId(r.getId())
                .status(r.getStatus())
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .reason(r.getReason())
                .reporterName(r.getReporter() != null ? r.getReporter().getFullName() : "Unknown")
                .submittedAt(r.getCreatedAt())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public ViolationDetailResponse getViolationDetail(UUID reportId) {
        ViolationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new BusinessException(MessageCodes.MODERATION_REPORT_NOT_FOUND, "Report not found"));
                
        List<ModerationDecision> decisions = decisionRepository.findByViolationReportIdOrderByCreatedAtDesc(reportId);
        List<ViolationDetailResponse.ModerationHistoryItem> history = decisions.stream().map(d -> {
            List<String> actionStrs = new ArrayList<>();
            if (d.getActions() != null) {
                actionStrs = d.getActions().stream().map(a -> a.getActionType().name()).collect(Collectors.toList());
            }
            return ViolationDetailResponse.ModerationHistoryItem.builder()
                    .decisionId(d.getId())
                    .decisionType(d.getDecisionType().name())
                    .decisionNote(d.getReason())
                    .decidedAt(d.getCreatedAt())
                    .decidedBy(d.getDecidedBy() != null ? d.getDecidedBy().getFullName() : "System")
                    .actions(actionStrs)
                    .build();
        }).collect(Collectors.toList());
        
        ViolationDetailResponse.ReporterSummary reporter = null;
        if (report.getReporter() != null) {
            reporter = ViolationDetailResponse.ReporterSummary.builder()
                    .reporterId(report.getReporter().getId())
                    .displayName(report.getReporter().getFullName())
                    .build();
        }
        
        ViolationDetailResponse.ViolationTarget target = ViolationDetailResponse.ViolationTarget.builder()
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .build();
                
        if ("COURSE".equalsIgnoreCase(report.getTargetType())) {
            courseRepository.findById(report.getTargetId()).ifPresent(course -> {
                target.setCourseId(course.getId());
                target.setCourseTitle(course.getTitle());
                target.setCurrentStatus(course.getStatus().name());
            });
        }
        
        List<ModerationActionType> availableActions = List.of(
                ModerationActionType.NONE,
                ModerationActionType.FORCE_DRAFT,
                ModerationActionType.HIDE_COURSE,
                ModerationActionType.BAN_ACCOUNT,
                ModerationActionType.FREEZE_BALANCE
        );

        return ViolationDetailResponse.builder()
                .reportId(report.getId())
                .status(report.getStatus())
                .reason(report.getReason())
                .submittedAt(report.getCreatedAt())
                .reporter(reporter)
                .target(target)
                .evidence(new ArrayList<>())
                .moderationHistory(history)
                .availableActions(availableActions)
                .build();
    }

    @Override
    @Transactional
    public ViolationDetailResponse resolveViolation(UUID reportId, ResolveViolationRequest request, UUID adminId) {
        ViolationReport report = reportRepository.findByIdLocked(reportId)
                .orElseThrow(() -> new BusinessException(MessageCodes.MODERATION_REPORT_NOT_FOUND, "Report not found"));
                
        if (report.getStatus() == ViolationReportStatus.RESOLVED_NO_VIOLATION || 
            report.getStatus() == ViolationReportStatus.RESOLVED_UPHELD ||
            report.getStatus() == ViolationReportStatus.CANCELLED) {
            throw new BusinessException(MessageCodes.MODERATION_ALREADY_RESOLVED, "Report is already resolved");
        }
        
        if ((request.getDecision() == ModerationDecisionType.DISMISSED || request.getDecision() == ModerationDecisionType.UPHELD) 
                && (request.getDecisionNote() == null || request.getDecisionNote().trim().isEmpty())) {
            throw new BusinessException(MessageCodes.MODERATION_DECISION_NOTE_REQUIRED, "Decision note is required");
        }
        
        InternalAdminAccount admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(MessageCodes.ADMIN_PERMISSION_DENIED, "Admin not found"));
                
        ViolationReportStatus statusBefore = report.getStatus();
        ViolationReportStatus statusAfter = statusBefore;
        
        ModerationDecision decision = ModerationDecision.builder()
                .violationReport(report)
                .decidedBy(admin)
                .decisionType(request.getDecision())
                .reason(request.getDecisionNote())
                .statusBefore(statusBefore)
                .build();
                
        decision = decisionRepository.save(decision);
        
        List<ModerationActionRecord> actionRecords = new ArrayList<>();
        List<String> actionNames = new ArrayList<>();
        UUID affectedTeacherId = null;

        if (request.getDecision() == ModerationDecisionType.DISMISSED) {
            statusAfter = ViolationReportStatus.RESOLVED_NO_VIOLATION;
            actionRecords.add(createActionRecord(decision, ModerationActionType.NONE, report.getTargetType(), report.getTargetId()));
            actionNames.add("NONE");
        } else if (request.getDecision() == ModerationDecisionType.UPHELD) {
            statusAfter = ViolationReportStatus.RESOLVED_UPHELD;
            
            if (request.getActions() == null || request.getActions().isEmpty()) {
                throw new BusinessException(MessageCodes.MODERATION_ACTION_REQUIRED, "Actions required for UPHELD decision");
            }
            
            for (ModerationActionType actionType : request.getActions()) {
                actionNames.add(actionType.name());
                
                if (actionType == ModerationActionType.FORCE_DRAFT) {
                    if ("COURSE".equalsIgnoreCase(report.getTargetType())) {
                        Course course = courseRepository.findById(report.getTargetId())
                                .orElseThrow(() -> new BusinessException(MessageCodes.MODERATION_TARGET_NOT_FOUND, "Course not found"));
                        course.setStatus(CourseStatus.FORCED_DRAFT);
                        courseRepository.save(course);
                        affectedTeacherId = course.getTeacher().getId();
                        actionRecords.add(createActionRecord(decision, actionType, "COURSE", course.getId()));
                    }
                } else if (actionType == ModerationActionType.BAN_ACCOUNT) {
                    UUID teacherIdToBan = getAffectedTeacherId(report);
                    if (teacherIdToBan != null) {
                        AppUser user = appUserRepository.findById(teacherIdToBan)
                                .orElseThrow(() -> new BusinessException(MessageCodes.MODERATION_TARGET_NOT_FOUND, "User not found"));
                        user.setUserStatus(AccountStatus.LOCKED);
                        appUserRepository.save(user);
                        affectedTeacherId = teacherIdToBan;
                        actionRecords.add(createActionRecord(decision, actionType, "USER", user.getId()));
                    }
                } else if (actionType == ModerationActionType.FREEZE_BALANCE) {
                    UUID teacherIdToFreeze = getAffectedTeacherId(report);
                    if (teacherIdToFreeze != null) {
                        TeacherWallet wallet = teacherWalletRepository.findByTeacherId(teacherIdToFreeze)
                                .orElseThrow(() -> new BusinessException(MessageCodes.MODERATION_TARGET_NOT_FOUND, "Wallet not found"));
                        wallet.setFrozen(true);
                        teacherWalletRepository.save(wallet);
                        affectedTeacherId = teacherIdToFreeze;
                        actionRecords.add(createActionRecord(decision, actionType, "WALLET", wallet.getId()));
                    }
                }
            }
        } else if (request.getDecision() == ModerationDecisionType.PENDING_EVIDENCE) {
            statusAfter = ViolationReportStatus.PENDING_EVIDENCE;
            actionRecords.add(createActionRecord(decision, ModerationActionType.NONE, report.getTargetType(), report.getTargetId()));
            actionNames.add("NONE");
        } else if (request.getDecision() == ModerationDecisionType.CORRECTION_REQUIRED) {
            statusAfter = ViolationReportStatus.CORRECTION_REQUIRED;
            actionRecords.add(createActionRecord(decision, ModerationActionType.NONE, report.getTargetType(), report.getTargetId()));
            actionNames.add("NONE");
        }
        
        actionRecordRepository.saveAll(actionRecords);
        decision.setActions(actionRecords);
        decision.setStatusAfter(statusAfter);
        decisionRepository.save(decision);
        
        report.setStatus(statusAfter);
        reportRepository.save(report);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("decision", request.getDecision().name());
        metadata.put("actions", actionNames);
        metadata.put("decisionNote", request.getDecisionNote());
        
        auditLogService.logAdminAction(
                adminId,
                "COURSE_MANAGER", 
                "RESOLVE_VIOLATION",
                report.getTargetType(),
                report.getTargetId(),
                Map.of("status", statusBefore.name()),
                Map.of("status", statusAfter.name()),
                metadata
        );
        
        if (affectedTeacherId != null && statusAfter == ViolationReportStatus.RESOLVED_UPHELD) {
            final UUID teacherIdForNotification = affectedTeacherId;
            appUserRepository.findById(teacherIdForNotification).ifPresent(user -> {
                notificationService.createNotification(
                        teacherIdForNotification,
                        user.getEmail(),
                        "Violation Report Upheld",
                        "Your content has been moderated due to a violation report. Actions taken: " + String.join(", ", actionNames),
                        "VIOLATION_UPHELD"
                );
            });
        }
        
        return getViolationDetail(reportId);
    }
    
    private ModerationActionRecord createActionRecord(ModerationDecision decision, ModerationActionType type, String targetType, UUID targetId) {
        return ModerationActionRecord.builder()
                .moderationDecision(decision)
                .actionType(type)
                .targetType(targetType)
                .targetId(targetId)
                .build();
    }
    
    private UUID getAffectedTeacherId(ViolationReport report) {
        if ("COURSE".equalsIgnoreCase(report.getTargetType())) {
            Optional<Course> course = courseRepository.findById(report.getTargetId());
            if (course.isPresent()) {
                return course.get().getTeacher().getId();
            }
        } else if ("USER".equalsIgnoreCase(report.getTargetType())) {
            return report.getTargetId();
        }
        return null;
    }
}
