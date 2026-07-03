package com.manabihub.kyc.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.User;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.dto.response.KycRequestResponse;
import com.manabihub.kyc.entity.KycRequest;
import com.manabihub.kyc.enums.KycStatus;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.service.KycService;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.notification.entity.Notification;
import com.manabihub.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycServiceImpl implements KycService {

    private final KycRequestRepository kycRequestRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;

    private void checkAdminAccess(UUID adminId) {
        User user = userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_UNAUTHORIZED,
                        "User not authenticated or found",
                        HttpStatus.UNAUTHORIZED
                ));

        String role = user.getRole();
        if (!"COURSE_MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new BusinessException(
                    MessageCodes.ADMIN_PERMISSION_DENIED,
                    "Access denied: Administrative privileges required",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private void checkCourseManagerAccess(UUID reviewerId) {
        User user = userRepository.findById(reviewerId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_UNAUTHORIZED,
                        "User not authenticated or found",
                        HttpStatus.UNAUTHORIZED
                ));

        String role = user.getRole();
        if (!"COURSE_MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new BusinessException(
                    MessageCodes.COURSE_MANAGER_REQUIRED,
                    "Only Course Manager is authorized to review KYC requests",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<KycRequestResponse> getPendingKycQueue(UUID adminId) {
        checkAdminAccess(adminId);
        List<KycRequest> requests = kycRequestRepository.findByStatusOrderByCreatedAtDesc(KycStatus.PENDING_ADMIN_REVIEW);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public KycRequestResponse getKycDetail(UUID id, UUID adminId) {
        checkAdminAccess(adminId);
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
    public KycRequestResponse reviewKyc(UUID id, KycReviewRequest request, UUID adminId) {
        checkCourseManagerAccess(adminId);

        KycRequest kycRequest = kycRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "KYC request not found",
                        HttpStatus.NOT_FOUND
                ));

        if (kycRequest.getStatus() != KycStatus.PENDING_ADMIN_REVIEW) {
            throw new BusinessException(
                    MessageCodes.COMMON_CONFLICT,
                    "KYC request has already been processed or is not pending review",
                    HttpStatus.CONFLICT
            );
        }

        User admin = userRepository.findById(adminId).orElseThrow();

        // Validate decision note for Reject or Request Correction
        KycStatus targetStatus = request.getStatus();
        if (targetStatus == KycStatus.REJECTED || targetStatus == KycStatus.RESUBMISSION_REQUIRED) {
            if (request.getDecisionNote() == null || request.getDecisionNote().trim().isEmpty()) {
                throw new BusinessException(
                        MessageCodes.VALIDATION_FAILED,
                        "Decision note is required for rejection or resubmission request",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Apply changes
        kycRequest.setStatus(targetStatus);
        kycRequest.setDecisionNote(request.getDecisionNote());
        kycRequest.setProcessedBy(admin);
        kycRequest.setProcessedAt(LocalDateTime.now());

        if (targetStatus == KycStatus.APPROVED) {
            User teacher = kycRequest.getTeacher();
            teacher.setRole("TEACHER"); // Upgrade role
            userRepository.save(teacher);
        }

        KycRequest savedRequest = kycRequestRepository.save(kycRequest);

        // 1. Create Audit Log
        String actionDetails = String.format(
                "Reviewed KYC for user display name: %s (New Status: %s). Note: %s",
                kycRequest.getDisplayName(),
                targetStatus,
                request.getDecisionNote() != null ? request.getDecisionNote() : "N/A"
        );
        AuditLog auditLog = AuditLog.builder()
                .actor(admin)
                .action("REVIEW_KYC")
                .targetType("KYC_REQUEST")
                .targetId(kycRequest.getId())
                .details(actionDetails)
                .build();
        auditLogRepository.save(auditLog);

        // 2. Create Notification
        String notifTitle = "Kết quả xét duyệt KYC giáo viên";
        String notifContent = "";
        if (targetStatus == KycStatus.APPROVED) {
            notifContent = "Hồ sơ xác minh (KYC) của bạn đã được phê duyệt. Bạn có thể bắt đầu tạo sản phẩm giảng dạy.";
        } else if (targetStatus == KycStatus.REJECTED) {
            notifContent = "Hồ sơ xác minh (KYC) của bạn bị từ chối. Lý do: " + request.getDecisionNote();
        } else if (targetStatus == KycStatus.RESUBMISSION_REQUIRED) {
            notifContent = "Yêu cầu sửa đổi hồ sơ xác minh (KYC). Lý do: " + request.getDecisionNote() + ". Vui lòng cập nhật và gửi lại.";
        }

        Notification notification = Notification.builder()
                .user(kycRequest.getTeacher())
                .title(notifTitle)
                .content(notifContent)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        return mapToResponse(savedRequest);
    }

    private KycRequestResponse mapToResponse(KycRequest request) {
        if (request == null) {
            return null;
        }
        return KycRequestResponse.builder()
                .id(request.getId())
                .teacherId(request.getTeacher().getId())
                .teacherEmail(request.getTeacher().getEmail())
                .teacherFullName(request.getTeacher().getFullName())
                .status(request.getStatus())
                .displayName(request.getDisplayName())
                .idCardFrontUrl(request.getIdCardFrontUrl())
                .idCardBackUrl(request.getIdCardBackUrl())
                .certificateUrl(request.getCertificateUrl())
                .selfieUrl(request.getSelfieUrl())
                .copyrightAccepted(request.getCopyrightAccepted())
                .vnptVerificationStatus(request.getVnptVerificationStatus())
                .vnptResponseDetails(request.getVnptResponseDetails())
                .riskLevel(request.getRiskLevel())
                .decisionNote(request.getDecisionNote())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .processedByEmail(request.getProcessedBy() != null ? request.getProcessedBy().getEmail() : null)
                .processedAt(request.getProcessedAt())
                .build();
    }
}
