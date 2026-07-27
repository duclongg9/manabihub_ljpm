package com.manabihub.kyc.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.*;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.dto.response.KycRequestResponse;
import com.manabihub.kyc.repository.InternalAdminAccountRepository;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.kyc.service.KycService;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.notification.entity.Notification;
import com.manabihub.notification.repository.NotificationRepository;
// removed UserRepository
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycServiceImpl implements KycService {

    private static final UUID TEACHER_ROLE_ID = UUID.fromString("a0000000-0000-0000-0000-000000000002");

    private final KycRequestRepository kycRequestRepository;
    private final InternalAdminAccountRepository adminAccountRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;

    private void checkCourseManagerAccess(UUID adminId) {
        boolean hasAccess = adminAccountRepository.existsByAdminIdAndRoleCodes(adminId, List.of("COURSE_MANAGER", "SYSTEM_ADMIN"));
        if (!hasAccess) {
            throw new BusinessException(
                    MessageCodes.ADMIN_PERMISSION_DENIED,
                    "Access denied: Course Manager privileges required",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<KycRequestResponse> getPendingKycQueue(UUID adminId) {
        checkCourseManagerAccess(adminId);
        // UC-28: chỉ hiển thị hồ sơ đã được auto-approve (APPROVED) để Course Manager
        // tra soát lại khi có tố cáo và thu hồi vai trò nếu phát hiện sai sót.
        List<KycRequest> requests = kycRequestRepository.findByStatusOrderByCreatedAtDesc(KycRequestStatus.APPROVED);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public KycRequestResponse getKycDetail(UUID id, UUID adminId) {
        checkCourseManagerAccess(adminId);
        KycRequest request = kycRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "KYC request not found",
                        HttpStatus.NOT_FOUND
                ));
        return mapToResponse(request);
    }

    @Override
    @Transactional
    public KycRequestResponse reviewKyc(UUID id, KycReviewRequest request, UUID adminId, String adminRole, String adminEmail) {
        checkCourseManagerAccess(adminId);

        KycRequest kycRequest = kycRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "KYC request not found",
                        HttpStatus.NOT_FOUND
                ));

        KycRequestStatus currentStatus = kycRequest.getStatus();
        KycRequestStatus targetStatus = request.getStatus();

        // UC-28: an already-APPROVED request can be revoked after a complaint;
        // otherwise only PENDING requests are reviewable.
        boolean isRevoke = currentStatus == KycRequestStatus.APPROVED
                && targetStatus == KycRequestStatus.REVOKED;
        if (currentStatus != KycRequestStatus.PENDING && !isRevoke) {
            throw new BusinessException(
                    MessageCodes.COMMON_CONFLICT,
                    "KYC request has already been processed or cannot transition to " + targetStatus,
                    HttpStatus.CONFLICT
            );
        }

        InternalAdminAccount admin = adminAccountRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(MessageCodes.AUTH_UNAUTHORIZED, "Admin not found", HttpStatus.UNAUTHORIZED));

        // DRAFT / PENDING are never valid review outcomes
        if (targetStatus == KycRequestStatus.DRAFT || targetStatus == KycRequestStatus.PENDING) {
            throw new BusinessException(
                    MessageCodes.VALIDATION_FAILED,
                    "Cannot review KYC with DRAFT or PENDING status",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Decision reason is required for Reject, Request Correction, and Revoke
        if (targetStatus == KycRequestStatus.REJECTED
                || targetStatus == KycRequestStatus.CORRECTION_REQUIRED
                || targetStatus == KycRequestStatus.REVOKED) {
            if (request.getDecisionNote() == null || request.getDecisionNote().trim().isEmpty()) {
                throw new BusinessException(
                        MessageCodes.VALIDATION_FAILED,
                        "Decision reason is required for rejection, correction, or revocation",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Apply changes
        kycRequest.setStatus(targetStatus);
        kycRequest.setDecisionReason(request.getDecisionNote());
        kycRequest.setReviewedBy(adminId);
        kycRequest.setReviewedAt(Instant.now());

        if (targetStatus == KycRequestStatus.APPROVED) {
            TeacherProfile teacher = kycRequest.getTeacherProfile();
            teacher.setKycStatus(TeacherKycStatus.APPROVED);
            teacher.setCanPublishCourse(true);
            teacherProfileRepository.save(teacher);
        } else if (targetStatus == KycRequestStatus.REJECTED) {
            TeacherProfile teacher = kycRequest.getTeacherProfile();
            teacher.setKycStatus(TeacherKycStatus.REJECTED);
            teacherProfileRepository.save(teacher);
        } else if (targetStatus == KycRequestStatus.CORRECTION_REQUIRED) {
            TeacherProfile teacher = kycRequest.getTeacherProfile();
            teacher.setKycStatus(TeacherKycStatus.CORRECTION_REQUIRED);
            teacherProfileRepository.save(teacher);
        } else if (targetStatus == KycRequestStatus.REVOKED) {
            TeacherProfile teacher = kycRequest.getTeacherProfile();
            teacher.setKycStatus(TeacherKycStatus.REVOKED);
            teacher.setCanPublishCourse(false);
            teacherProfileRepository.save(teacher);
            // Gỡ vai trò TEACHER khỏi tài khoản người dùng khi thu hồi
            revokeTeacherRole(teacher.getUser().getId());
        }

        KycRequest savedRequest = kycRequestRepository.save(kycRequest);

        // Create Audit Log
        AuditLog log = AuditLog.builder()
                .actorType("INTERNAL_ADMIN")
                .actorAdminId(adminId)
                .actorRoleCode(adminRole)
                .action("KYC_REVIEW")
                .targetType("KYC_REQUEST")
                .targetId(kycRequest.getId())
                .beforeValue(Map.of("status", currentStatus.name()))
                .afterValue(Map.of("status", targetStatus.name()))
                .metadata(Map.of("decisionNote", request.getDecisionNote() != null ? request.getDecisionNote() : ""))
                .build();
        auditLogRepository.save(log);

        // Create Notification
        String title = "Kết quả kiểm duyệt hồ sơ KYC";
        String message = "";
        if (targetStatus == KycRequestStatus.APPROVED) {
            message = "Chúc mừng! Hồ sơ KYC của bạn đã được phê duyệt. Bạn đã có thể xuất bản khóa học.";
        } else if (targetStatus == KycRequestStatus.REJECTED) {
            message = "Rất tiếc, hồ sơ KYC của bạn đã bị từ chối. Lý do: " + request.getDecisionNote();
        } else if (targetStatus == KycRequestStatus.CORRECTION_REQUIRED) {
            message = "Hồ sơ KYC của bạn cần được chỉnh sửa. Lý do: " + request.getDecisionNote();
        } else if (targetStatus == KycRequestStatus.REVOKED) {
            title = "Vai trò giảng viên đã bị thu hồi";
            message = "Vai trò giảng viên của bạn đã bị thu hồi và quyền xuất bản khóa học đã bị gỡ bỏ. Lý do: " + request.getDecisionNote();
        }

        Notification notification = Notification.builder()
                .recipientUserId(kycRequest.getTeacherProfile().getUser().getId())
                .title(title)
                .message(message)
                .notificationType("KYC_RESULT")
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        return mapToResponse(savedRequest);
    }

    private KycRequestResponse mapToResponse(KycRequest request) {
        if (request == null) {
            return null;
        }

        TeacherProfile teacher = request.getTeacherProfile();
        AppUser user = teacher.getUser();

        List<KycDocument> documents = kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(request.getId());

        String frontUrl = getDocUrl(documents, KycDocumentType.ID_CARD_FRONT);
        String backUrl = getDocUrl(documents, KycDocumentType.ID_CARD_BACK);
        String certUrl = getDocUrl(documents, KycDocumentType.CERTIFICATE);
        String selfieUrl = getDocUrl(documents, KycDocumentType.SELFIE);

        String vnptVerificationStatus = null;
        String vnptResponseDetails = null;
        if (request.getVerificationPayload() != null) {
            vnptVerificationStatus = (String) request.getVerificationPayload().get("providerStatus");
            try {
                Object providerResult = request.getVerificationPayload().get("providerResult");
                if (providerResult != null) {
                    vnptResponseDetails = objectMapper.writeValueAsString(providerResult);
                }
            } catch (Exception e) {
                vnptResponseDetails = "{}";
            }
        }

        String processedByEmail = null;
        if (request.getReviewedBy() != null) {
            processedByEmail = adminAccountRepository.findById(request.getReviewedBy())
                    .map(InternalAdminAccount::getEmail)
                    .orElse(null);
        }

        return KycRequestResponse.builder()
                .id(request.getId())
                .teacherId(teacher.getId())
                .teacherEmail(user != null ? user.getEmail() : null)
                .teacherFullName(user != null ? user.getFullName() : null)
                .status(request.getStatus())
                .displayName(teacher.getDisplayName())
                .idCardFrontUrl(frontUrl)
                .idCardBackUrl(backUrl)
                .certificateUrl(certUrl)
                .selfieUrl(selfieUrl)
                .copyrightAccepted(request.isCopyrightAgreed())
                .vnptVerificationStatus(vnptVerificationStatus)
                .vnptResponseDetails(vnptResponseDetails)
                .riskLevel(request.getRiskLevel() != null ? request.getRiskLevel().name() : null)
                .decisionNote(request.getDecisionReason())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .processedByEmail(processedByEmail)
                .processedAt(request.getReviewedAt())
                .build();
    }

    private String getDocUrl(List<KycDocument> documents, KycDocumentType type) {
        return documents.stream()
                .filter(doc -> doc.getDocumentType() == type)
                .map(KycDocument::getFileUrl)
                .findFirst()
                .orElse(null);
    }

    private void revokeTeacherRole(UUID userId) {
        entityManager.createNativeQuery(
                "DELETE FROM user_roles WHERE user_id = :userId AND role_id = :roleId"
        ).setParameter("userId", userId)
         .setParameter("roleId", TEACHER_ROLE_ID)
         .executeUpdate();
    }
}
