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

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycServiceImpl implements KycService {

    private final KycRequestRepository kycRequestRepository;
    private final InternalAdminAccountRepository adminAccountRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final KycDocumentRepository kycDocumentRepository;

    // We leave out AuditLogRepository and NotificationRepository if they don't map cleanly yet, 
    // but assuming they do based on the imports from before, I'll remove them temporarily 
    // to avoid compilation issues on AuditLog/Notification domain objects that might differ.
    // Wait, let's keep them if they compile.
    // Let's just use the minimum required for UC-28 logic.

    private void checkCourseManagerAccess(UUID adminId) {
        List<InternalAdminAccount> authorizedAdmins = adminAccountRepository.findActiveAdminsByRoleCodes(List.of("COURSE_MANAGER", "SYSTEM_ADMIN"));
        boolean hasAccess = authorizedAdmins.stream().anyMatch(a -> a.getId().equals(adminId));
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
        List<KycRequest> requests = kycRequestRepository.findByStatusOrderByCreatedAtDesc(KycRequestStatus.PENDING);
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
    public KycRequestResponse reviewKyc(UUID id, KycReviewRequest request, UUID adminId) {
        checkCourseManagerAccess(adminId);

        KycRequest kycRequest = kycRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "KYC request not found",
                        HttpStatus.NOT_FOUND
                ));

        if (kycRequest.getStatus() != KycRequestStatus.PENDING) {
            throw new BusinessException(
                    MessageCodes.COMMON_CONFLICT,
                    "KYC request has already been processed or is not pending review",
                    HttpStatus.CONFLICT
            );
        }

        InternalAdminAccount admin = adminAccountRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(MessageCodes.AUTH_UNAUTHORIZED, "Admin not found", HttpStatus.UNAUTHORIZED));

        // Validate decision note for Reject or Request Correction
        KycRequestStatus targetStatus = request.getStatus();
        if (targetStatus == KycRequestStatus.REJECTED || targetStatus == KycRequestStatus.CORRECTION_REQUIRED) {
            if (request.getDecisionNote() == null || request.getDecisionNote().trim().isEmpty()) {
                throw new BusinessException(
                        MessageCodes.VALIDATION_FAILED,
                        "Decision reason is required for rejection or correction request",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Apply changes
        kycRequest.setStatus(targetStatus);
        kycRequest.setDecisionReason(request.getDecisionNote());

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
        }

        KycRequest savedRequest = kycRequestRepository.save(kycRequest);

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
                .riskLevel(request.getRiskLevel() != null ? request.getRiskLevel().name() : null)
                .decisionNote(request.getDecisionReason())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    private String getDocUrl(List<KycDocument> documents, KycDocumentType type) {
        return documents.stream()
                .filter(doc -> doc.getDocumentType() == type)
                .map(KycDocument::getFileUrl)
                .findFirst()
                .orElse(null);
    }
}
