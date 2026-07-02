package com.manabihub.kyc.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.AuditLog;
import com.manabihub.kyc.domain.CertificateVerificationStatus;
import com.manabihub.kyc.domain.IdentityVerificationStatus;
import com.manabihub.kyc.domain.InternalAdminAccount;
import com.manabihub.kyc.domain.KycDocument;
import com.manabihub.kyc.domain.KycDocumentType;
import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.KycRequestStatus;
import com.manabihub.kyc.domain.Notification;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.dto.KycCertificateSubmissionResponse;
import com.manabihub.kyc.dto.KycDocumentResponse;
import com.manabihub.kyc.dto.KycIdentityVerificationRequest;
import com.manabihub.kyc.dto.KycIdentityVerificationResponse;
import com.manabihub.kyc.dto.KycModuleStatusResponse;
import com.manabihub.kyc.dto.KycRequestResponse;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.repository.AuditLogRepository;
import com.manabihub.kyc.repository.InternalAdminAccountRepository;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.NotificationRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class TeacherKycService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> CERTIFICATE_MIME_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final Set<String> CERTIFICATE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");
    private static final List<String> ADMIN_NOTIFICATION_ROLE_CODES = List.of("COURSE_MANAGER", "SYSTEM_ADMIN");

    private final TeacherProfileRepository teacherProfileRepository;
    private final KycRequestRepository kycRequestRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final InternalAdminAccountRepository internalAdminAccountRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final Path storageRoot;

    public TeacherKycService(
            TeacherProfileRepository teacherProfileRepository,
            KycRequestRepository kycRequestRepository,
            KycDocumentRepository kycDocumentRepository,
            InternalAdminAccountRepository internalAdminAccountRepository,
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            @Value("${manabihub.kyc.storage-root:storage/kyc}") String storageRoot
    ) {
        this.teacherProfileRepository = teacherProfileRepository;
        this.kycRequestRepository = kycRequestRepository;
        this.kycDocumentRepository = kycDocumentRepository;
        this.internalAdminAccountRepository = internalAdminAccountRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.storageRoot = Path.of(storageRoot).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public KycStatusResponse getStatus(UUID userId) {
        TeacherProfile teacherProfile = resolveTeacher(userId);
        KycRequest latestRequest = kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherProfile.getId())
                .orElse(null);

        return new KycStatusResponse(
                teacherProfile.getId(),
                teacherProfile.getUser().getId(),
                teacherProfile.getKycStatus().name(),
                statusLabel(teacherProfile.getKycStatus()),
                teacherProfile.isCanPublishCourse(),
                identityModuleStatus(teacherProfile, latestRequest),
                certificateModuleStatus(teacherProfile, latestRequest),
                latestRequest == null ? null : toRequestResponse(latestRequest),
                srsTrace()
        );
    }

    @Transactional
    public KycIdentityVerificationResponse verifyIdentity(
            UUID userId,
            KycIdentityVerificationRequest request,
            String ipAddress,
            String userAgent
    ) {
        if (request == null || request.sdkResult() == null || request.sdkResult().isEmpty()) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "VNPT eKYC SDK result is required before identity verification can be recorded"
            );
        }

        TeacherProfile teacherProfile = resolveTeacher(userId);
        AppUser user = teacherProfile.getUser();
        KycRequest latestRequest = findLatestRequest(teacherProfile);
        validateIdentityAllowed(user, teacherProfile, latestRequest);

        KycRequest kycRequest = findReusableRealtimeRequest(teacherProfile, latestRequest);
        boolean verified = isSdkResultVerified(request.sdkResult());
        Instant now = Instant.now();

        kycRequest.setStatus(KycRequestStatus.DRAFT);
        kycRequest.setTeacherProfile(teacherProfile);
        kycRequest.setEkycProvider("VNPT_EKYC_WEB_SDK");
        kycRequest.setProviderSessionId(blankToNull(request.providerSessionId()));
        kycRequest.setProviderTransactionId(blankToNull(request.providerTransactionId()));
        kycRequest.setIdentityStatus(verified ? IdentityVerificationStatus.VERIFIED : IdentityVerificationStatus.FAILED);
        kycRequest.setIdentityVerifiedAt(verified ? now : null);
        kycRequest.setCertificateStatus(verified ? CertificateVerificationStatus.NOT_SUBMITTED : CertificateVerificationStatus.LOCKED);
        kycRequest.setVerificationPayload(Map.of(
                "identityProvider", "VNPT_EKYC_WEB_SDK",
                "providerResult", request.sdkResult() == null ? Map.of() : request.sdkResult(),
                "providerStatus", verified ? "SDK_VERIFIED" : "SDK_FAILED",
                "certificateAsyncReviewRequired", true,
                "autoApproval", false,
                "srs", srsTrace()
        ));

        KycRequest savedRequest = kycRequestRepository.save(kycRequest);
        savedRequest.setEkycReferenceId("VNPT-SDK-" + savedRequest.getId());
        boolean auditLogged = createIdentityAudit(savedRequest, user, ipAddress, userAgent);

        return new KycIdentityVerificationResponse(
                teacherProfile.getId(),
                teacherProfile.getKycStatus().name(),
                toRequestResponse(savedRequest),
                identityModuleStatus(teacherProfile, savedRequest),
                certificateModuleStatus(teacherProfile, savedRequest),
                auditLogged,
                srsTrace()
        );
    }

    @Transactional
    public KycCertificateSubmissionResponse submitCertificate(
            UUID userId,
            MultipartFile certificate,
            String certificateCode,
            boolean copyrightAgreementAccepted,
            String ipAddress,
            String userAgent
    ) {
        TeacherProfile teacherProfile = resolveTeacher(userId);
        AppUser user = teacherProfile.getUser();
        KycRequest kycRequest = validateCertificateSubmissionAllowed(user, teacherProfile);
        validateAgreement(copyrightAgreementAccepted);

        if (!StringUtils.hasText(certificateCode)) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "Certificate code is required for JLPT / J-Test / NAT-TEST registry matching"
            );
        }

        PreparedFile certificateFile = prepareCertificateFile(certificate);
        KycDocument certificateDocument = storeDocument(kycRequest, certificateFile);
        kycDocumentRepository.save(certificateDocument);

        TeacherKycStatus beforeStatus = teacherProfile.getKycStatus();
        kycRequest.setStatus(KycRequestStatus.PENDING);
        kycRequest.setCertificateStatus(CertificateVerificationStatus.PENDING_REVIEW);
        kycRequest.setCertificateCode(certificateCode.trim());
        kycRequest.setCertificateSubmittedAt(Instant.now());
        kycRequest.setCopyrightAgreed(true);
        kycRequest.setVerificationPayload(withCertificatePayload(kycRequest));

        teacherProfile.setKycStatus(TeacherKycStatus.PENDING);
        teacherProfile.setCanPublishCourse(false);

        boolean adminNotificationCreated = createAdminNotifications(kycRequest, user);
        boolean auditLogged = createCertificateSubmissionAudit(kycRequest, user, beforeStatus, ipAddress, userAgent);
        List<KycDocument> documents = kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(kycRequest.getId());

        return new KycCertificateSubmissionResponse(
                teacherProfile.getId(),
                teacherProfile.getKycStatus().name(),
                teacherProfile.isCanPublishCourse(),
                toRequestResponse(kycRequest, documents),
                identityModuleStatus(teacherProfile, kycRequest),
                certificateModuleStatus(teacherProfile, kycRequest),
                adminNotificationCreated,
                auditLogged,
                srsTrace()
        );
    }

    private TeacherProfile resolveTeacher(UUID userId) {
        return teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.KYC_TEACHER_NOT_FOUND,
                        "Teacher profile was not found for the current user",
                        HttpStatus.NOT_FOUND
                ));
    }

    private void validateIdentityAllowed(AppUser user, TeacherProfile teacherProfile, KycRequest latestRequest) {
        if (user.getUserStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(
                    MessageCodes.MSG_ADM_002,
                    "Teacher account is not allowed to start identity verification",
                    HttpStatus.FORBIDDEN
            );
        }

        if (latestRequest != null
                && latestRequest.getStatus() == KycRequestStatus.PENDING
                && latestRequest.getIdentityStatus() == IdentityVerificationStatus.VERIFIED
                && resolvedCertificateStatus(latestRequest) == CertificateVerificationStatus.PENDING_REVIEW) {
            throw new BusinessException(
                    MessageCodes.KYC_ALREADY_PENDING,
                    "Certificate review is already pending",
                    HttpStatus.CONFLICT
            );
        }

        if (teacherProfile.getKycStatus() == TeacherKycStatus.APPROVED) {
            throw new BusinessException(
                    MessageCodes.KYC_ALREADY_APPROVED,
                    "KYC is already approved",
                    HttpStatus.CONFLICT
            );
        }
    }

    private KycRequest validateCertificateSubmissionAllowed(AppUser user, TeacherProfile teacherProfile) {
        KycRequest latestRequest = kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherProfile.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_KYC_002,
                        "Identity verification must be completed before certificate submission"
                ));
        validateIdentityAllowed(user, teacherProfile, latestRequest);

        if (latestRequest.getIdentityStatus() != IdentityVerificationStatus.VERIFIED) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "Identity verification must be successful before certificate submission"
            );
        }

        if (latestRequest.getStatus() == KycRequestStatus.PENDING
                || resolvedCertificateStatus(latestRequest) == CertificateVerificationStatus.PENDING_REVIEW) {
            throw new BusinessException(
                    MessageCodes.KYC_ALREADY_PENDING,
                    "Certificate is already pending admin review",
                    HttpStatus.CONFLICT
            );
        }

        return latestRequest;
    }

    private void validateAgreement(boolean accepted) {
        if (!accepted) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "Digital Copyright Liability Agreement must be accepted"
            );
        }
    }

    private KycRequest findLatestRequest(TeacherProfile teacherProfile) {
        return kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherProfile.getId())
                .orElse(null);
    }

    private KycRequest findReusableRealtimeRequest(TeacherProfile teacherProfile, KycRequest latestRequest) {
        return java.util.Optional.ofNullable(latestRequest)
                .filter(request -> request.getStatus() == KycRequestStatus.DRAFT
                        || request.getIdentityStatus() == IdentityVerificationStatus.FAILED)
                .orElseGet(KycRequest::new);
    }

    private PreparedFile prepareCertificateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalidFile("Certificate file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw invalidFile("File must not exceed 5MB");
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String extension = extensionOf(originalFileName);
        String mimeType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();

        if (!CERTIFICATE_MIME_TYPES.contains(mimeType) && !CERTIFICATE_EXTENSIONS.contains(extension)) {
            throw invalidFile("Certificate must be JPG, PNG, or PDF");
        }

        try {
            byte[] bytes = file.getBytes();
            String hash = sha256(bytes);

            return new PreparedFile(KycDocumentType.CERTIFICATE, originalFileName, mimeType, file.getSize(), hash, bytes);
        } catch (IOException ex) {
            throw invalidFile("Could not read uploaded certificate");
        }
    }

    private KycDocument storeDocument(KycRequest request, PreparedFile preparedFile) {
        String storedFileName = UUID.randomUUID() + "-" + preparedFile.fileName();
        Path targetDirectory = storageRoot.resolve(request.getId().toString()).normalize();
        Path targetPath = targetDirectory.resolve(storedFileName).normalize();

        if (!targetPath.startsWith(storageRoot)) {
            throw new BusinessException(MessageCodes.MSG_KYC_002, "Invalid storage path");
        }

        try {
            Files.createDirectories(targetDirectory);
            Files.write(targetPath, preparedFile.bytes());
        } catch (IOException ex) {
            throw new BusinessException(
                    MessageCodes.COMMON_INTERNAL_ERROR,
                    "Could not store KYC document securely",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ex
            );
        }

        KycDocument document = new KycDocument();
        document.setKycRequest(request);
        document.setDocumentType(preparedFile.documentType());
        document.setFileName(preparedFile.fileName());
        document.setMimeType(preparedFile.mimeType());
        document.setFileSize(preparedFile.fileSize());
        document.setFileHash(preparedFile.fileHash());
        document.setFileUrl("restricted://kyc/" + request.getId() + "/" + storedFileName);

        return document;
    }

    private boolean createAdminNotifications(KycRequest request, AppUser user) {
        List<InternalAdminAccount> admins = internalAdminAccountRepository.findActiveAdminsByRoleCodes(ADMIN_NOTIFICATION_ROLE_CODES);

        if (admins.isEmpty()) {
            return false;
        }

        List<Notification> notifications = admins.stream().map(admin -> {
            Notification notification = new Notification();
            notification.setRecipientAdmin(admin);
            notification.setTitle("New teacher certificate review");
            notification.setMessage("Teacher " + user.getFullName() + " submitted certificate for KYC request " + request.getId() + ".");
            notification.setNotificationType("KYC_REVIEW_REQUESTED");
            notification.setRead(false);
            return notification;
        }).toList();

        notificationRepository.saveAll(notifications);
        return true;
    }

    private boolean createIdentityAudit(
            KycRequest request,
            AppUser user,
            String ipAddress,
            String userAgent
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActorType("USER");
        auditLog.setActorUserId(user.getId());
        auditLog.setActorRoleCode("TEACHER");
        auditLog.setAction("KYC_IDENTITY_VERIFY");
        auditLog.setTargetType("KYC_REQUEST");
        auditLog.setTargetId(request.getId());
        auditLog.setAfterValue(Map.of(
                "identityStatus", request.getIdentityStatus().name(),
                "provider", request.getEkycProvider()
        ));
        auditLog.setMetadata(Map.of(
                "uc", "UC-22",
                "module", "IDENTITY_VERIFICATION",
                "provider", "VNPT_EKYC_WEB_SDK"
        ));
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLogRepository.save(auditLog);
        return true;
    }

    private boolean createCertificateSubmissionAudit(
            KycRequest request,
            AppUser user,
            TeacherKycStatus beforeStatus,
            String ipAddress,
            String userAgent
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActorType("USER");
        auditLog.setActorUserId(user.getId());
        auditLog.setActorRoleCode("TEACHER");
        auditLog.setAction("KYC_CERTIFICATE_SUBMIT");
        auditLog.setTargetType("KYC_REQUEST");
        auditLog.setTargetId(request.getId());
        auditLog.setBeforeValue(Map.of("teacherKycStatus", beforeStatus.name()));
        auditLog.setAfterValue(Map.of(
                "teacherKycStatus", TeacherKycStatus.PENDING.name(),
                "requestStatus", request.getStatus().name(),
                "certificateStatus", request.getCertificateStatus().name()
        ));
        auditLog.setMetadata(Map.of(
                "uc", "UC-22",
                "br", List.of("BR-KYC-01", "BR-KYC-03", "BR-NOTIF-02", "BR-AUD-01"),
                "msg", MessageCodes.MSG_KYC_003,
                "module", "CERTIFICATE_ASYNC_REVIEW"
        ));
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLogRepository.save(auditLog);
        return true;
    }

    private KycRequestResponse toRequestResponse(KycRequest request) {
        List<KycDocument> documents = kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(request.getId());

        return toRequestResponse(request, documents);
    }

    private KycRequestResponse toRequestResponse(KycRequest request, List<KycDocument> documents) {
        return new KycRequestResponse(
                request.getId(),
                request.getStatus().name(),
                requestStatusLabel(request.getStatus()),
                request.getSubmittedAt(),
                request.getEkycProvider(),
                request.getEkycReferenceId(),
                request.getProviderSessionId(),
                request.getProviderTransactionId(),
                request.getIdentityStatus().name(),
                identityStatusLabel(request.getIdentityStatus()),
                request.getIdentityVerifiedAt(),
                resolvedCertificateStatus(request).name(),
                certificateStatusLabel(resolvedCertificateStatus(request)),
                request.getCertificateSubmittedAt(),
                request.getRiskLevel() == null ? null : request.getRiskLevel().name(),
                request.getCertificateCode(),
                request.isCopyrightAgreed(),
                request.getVerificationPayload(),
                documents.stream().map(this::toDocumentResponse).toList()
        );
    }

    private KycDocumentResponse toDocumentResponse(KycDocument document) {
        return new KycDocumentResponse(
                document.getId(),
                document.getDocumentType().name(),
                document.getFileName(),
                document.getMimeType(),
                document.getFileSize() == null ? 0 : document.getFileSize(),
                document.getFileHash(),
                document.getCreatedAt()
        );
    }

    private KycModuleStatusResponse identityModuleStatus(TeacherProfile teacherProfile, KycRequest latestRequest) {
        if (latestRequest == null) {
            return new KycModuleStatusResponse(
                IdentityVerificationStatus.NOT_STARTED.name(),
                identityStatusLabel(IdentityVerificationStatus.NOT_STARTED),
                teacherProfile.getKycStatus() != TeacherKycStatus.APPROVED,
                null,
                "Bắt đầu VNPT eKYC để chụp CCCD và kiểm tra liveness khuôn mặt."
        );
        }

        IdentityVerificationStatus status = latestRequest.getIdentityStatus();
        return new KycModuleStatusResponse(
                status.name(),
                identityStatusLabel(status),
                canInteractWithIdentityModule(teacherProfile, latestRequest),
                latestRequest.getIdentityVerifiedAt(),
                identityStatusDetail(status)
        );
    }

    private KycModuleStatusResponse certificateModuleStatus(TeacherProfile teacherProfile, KycRequest latestRequest) {
        if (latestRequest == null || latestRequest.getIdentityStatus() != IdentityVerificationStatus.VERIFIED) {
            return new KycModuleStatusResponse(
                    CertificateVerificationStatus.LOCKED.name(),
                    certificateStatusLabel(CertificateVerificationStatus.LOCKED),
                    false,
                    null,
                    "Hoàn tất xác thực danh tính trước khi nộp chứng chỉ."
            );
        }

        CertificateVerificationStatus status = resolvedCertificateStatus(latestRequest);
        boolean canInteract = teacherProfile.getKycStatus() != TeacherKycStatus.APPROVED
                && (status == CertificateVerificationStatus.NOT_SUBMITTED
                || status == CertificateVerificationStatus.REJECTED
                || latestRequest.getStatus() == KycRequestStatus.REJECTED
                || latestRequest.getStatus() == KycRequestStatus.CORRECTION_REQUIRED);

        return new KycModuleStatusResponse(
                status.name(),
                certificateStatusLabel(status),
                canInteract,
                latestRequest.getCertificateSubmittedAt(),
                certificateStatusDetail(status)
        );
    }

    private CertificateVerificationStatus resolvedCertificateStatus(KycRequest request) {
        return switch (request.getStatus()) {
            case APPROVED -> CertificateVerificationStatus.APPROVED;
            case REJECTED, CORRECTION_REQUIRED -> CertificateVerificationStatus.REJECTED;
            case DRAFT, PENDING -> request.getCertificateStatus();
        };
    }

    private boolean canInteractWithIdentityModule(TeacherProfile teacherProfile, KycRequest latestRequest) {
        if (teacherProfile.getKycStatus() == TeacherKycStatus.APPROVED) {
            return false;
        }

        if (latestRequest.getIdentityStatus() == IdentityVerificationStatus.VERIFIED
                || latestRequest.getIdentityStatus() == IdentityVerificationStatus.PROCESSING) {
            return false;
        }

        return latestRequest.getStatus() != KycRequestStatus.PENDING
                || resolvedCertificateStatus(latestRequest) != CertificateVerificationStatus.PENDING_REVIEW;
    }

    private Map<String, Object> withCertificatePayload(KycRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>(request.getVerificationPayload());
        payload.put("certificateStatus", CertificateVerificationStatus.PENDING_REVIEW.name());
        payload.put("certificateCode", request.getCertificateCode());
        payload.put("certificateReviewMode", "ASYNC_CERTIFICATE_REVIEW");
        payload.put("registryVerification", "WAITING_FOR_MHB_12_MOCK_REGISTRY");
        payload.put("copyrightAgreement", "ACCEPTED_BY_CHECKBOX");
        payload.put("autoApproval", false);
        return payload;
    }

    private boolean isSdkResultVerified(Map<String, Object> sdkResult) {
        if (sdkResult == null || sdkResult.isEmpty()) {
            return false;
        }

        List<ResultEntry> entries = flattenResult(sdkResult);
        boolean hasExplicitInvalid = entries.stream().anyMatch(this::isExplicitInvalidValue);
        boolean hasExplicitSuccess = entries.stream().anyMatch(this::isExplicitSuccessValue);
        boolean hasVerificationData = entries.stream().anyMatch(entry -> {
            String key = entry.key();
            return key.contains("ocr")
                    || key.contains("liveness")
                    || key.contains("compare")
                    || key.contains("matching")
                    || key.contains("similarity")
                    || key.contains("identity");
        });

        return !hasExplicitInvalid && (hasExplicitSuccess || hasVerificationData);
    }

    private List<ResultEntry> flattenResult(Map<String, Object> value) {
        java.util.ArrayList<ResultEntry> entries = new java.util.ArrayList<>();
        collectResultEntries(value, "", entries, 0);
        return entries;
    }

    @SuppressWarnings("unchecked")
    private void collectResultEntries(Object current, String path, List<ResultEntry> entries, int depth) {
        if (current == null || depth > 8) {
            return;
        }

        if (current instanceof Map<?, ?> map) {
            map.forEach((key, value) -> {
                String nextPath = path.isBlank() ? String.valueOf(key).toLowerCase() : path + "." + String.valueOf(key).toLowerCase();
                entries.add(new ResultEntry(nextPath, value));
                collectResultEntries(value, nextPath, entries, depth + 1);
            });
            return;
        }

        if (current instanceof Iterable<?> iterable) {
            for (Object item : iterable) {
                collectResultEntries(item, path, entries, depth + 1);
            }
        }
    }

    private boolean isExplicitInvalidValue(ResultEntry entry) {
        Object value = entry.value();
        String key = entry.key();

        if (key.contains("valid") && value instanceof Boolean booleanValue && !booleanValue) {
            return true;
        }

        if (value instanceof String text) {
            String normalized = text.toLowerCase();
            return normalized.contains("khong hop le")
                    || normalized.contains("không hợp lệ")
                    || normalized.contains("invalid")
                    || normalized.contains("failed")
                    || normalized.contains("failure");
        }

        return false;
    }

    private boolean isExplicitSuccessValue(ResultEntry entry) {
        Object value = entry.value();
        String key = entry.key();

        if ((key.contains("success") || key.contains("verified") || key.contains("valid")) && value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        if (value instanceof String text) {
            String normalized = text.toLowerCase();
            return normalized.equals("valid")
                    || normalized.equals("success")
                    || normalized.equals("verified")
                    || normalized.contains("hợp lệ");
        }

        return false;
    }

    private BusinessException invalidFile(String reason) {
        return new BusinessException(
                MessageCodes.MSG_KYC_002,
                "JLPT / J-Test / NAT-TEST Certificate: " + reason
        );
    }

    private String sanitizeFileName(String value) {
        String cleanName = StringUtils.cleanPath(value == null ? "kyc-certificate" : value);
        String fileName = Path.of(cleanName).getFileName().toString().replaceAll("[^A-Za-z0-9._-]", "_");

        return fileName.isBlank() ? "kyc-certificate" : fileName;
    }

    private String extensionOf(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');

        return dotIndex < 0 ? "" : fileName.substring(dotIndex + 1).toLowerCase();
    }

    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new BusinessException(
                    MessageCodes.COMMON_INTERNAL_ERROR,
                    "SHA-256 digest is not available",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ex
            );
        }
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String statusLabel(TeacherKycStatus status) {
        return switch (status) {
            case NOT_SUBMITTED -> "Chưa nộp";
            case PENDING -> "Chờ kiểm tra KYC";
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Bị từ chối";
            case CORRECTION_REQUIRED -> "Yêu cầu bổ sung";
        };
    }

    private String requestStatusLabel(KycRequestStatus status) {
        return switch (status) {
            case DRAFT -> "Bản nháp xác thực danh tính";
            case PENDING -> "Chờ kiểm tra KYC";
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Bị từ chối";
            case CORRECTION_REQUIRED -> "Yêu cầu bổ sung";
        };
    }

    private String identityStatusLabel(IdentityVerificationStatus status) {
        return switch (status) {
            case NOT_STARTED -> "Chưa xác thực danh tính";
            case PROCESSING -> "Đang xác thực danh tính";
            case VERIFIED -> "Xác thực danh tính thành công";
            case FAILED -> "Xác thực danh tính thất bại";
        };
    }

    private String identityStatusDetail(IdentityVerificationStatus status) {
        return switch (status) {
            case NOT_STARTED -> "Bắt đầu VNPT eKYC để chụp CCCD và kiểm tra liveness khuôn mặt.";
            case PROCESSING -> "VNPT eKYC đang xử lý phiên xác thực realtime.";
            case VERIFIED -> "CCCD và liveness khuôn mặt đã được xác thực qua VNPT eKYC.";
            case FAILED -> "Kết quả VNPT eKYC không hợp lệ. Giáo viên có thể thực hiện lại ngay.";
        };
    }

    private String certificateStatusLabel(CertificateVerificationStatus status) {
        return switch (status) {
            case LOCKED -> "Chưa mở khóa";
            case NOT_SUBMITTED -> "Chưa nộp chứng chỉ";
            case PENDING_REVIEW -> "Đang chờ kiểm tra chứng chỉ";
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Bị từ chối";
        };
    }

    private String certificateStatusDetail(CertificateVerificationStatus status) {
        return switch (status) {
            case LOCKED -> "Hoàn tất xác thực danh tính trước khi nộp chứng chỉ.";
            case NOT_SUBMITTED -> "Nộp JLPT / J-Test / NAT-TEST Certificate và mã chứng chỉ bắt buộc.";
            case PENDING_REVIEW -> "Hồ sơ chứng chỉ đã vào hàng chờ kiểm tra/đối soát.";
            case APPROVED -> "Chứng chỉ đã được Admin duyệt.";
            case REJECTED -> "Chỉ cần nộp lại module chứng chỉ.";
        };
    }

    private Map<String, Object> srsTrace() {
        return Map.of(
                "uc", "UC-22",
                "br", List.of("BR-KYC-01", "BR-KYC-03", "BR-KYC-05", "BR-NOTIF-02", "BR-AUD-01"),
                "msg", List.of(MessageCodes.MSG_KYC_003, MessageCodes.MSG_KYC_002, MessageCodes.MSG_KYC_008),
                "moduleFlow", List.of("VNPT realtime identity verification", "Async certificate review")
        );
    }

    private record PreparedFile(
            KycDocumentType documentType,
            String fileName,
            String mimeType,
            long fileSize,
            String fileHash,
            byte[] bytes
    ) {
    }

    private record ResultEntry(String key, Object value) {
    }
}
