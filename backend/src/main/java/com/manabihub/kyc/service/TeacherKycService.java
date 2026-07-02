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
import com.manabihub.kyc.dto.KycRestartVerificationResponse;
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
    private static final String VNPT_PROVIDER = "VNPT_EKYC_WEB_SDK";

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
        VnptSdkDecision sdkDecision = evaluateSdkResult(request.sdkResult());
        boolean verified = sdkDecision.verified();
        Instant now = Instant.now();

        kycRequest.setStatus(KycRequestStatus.DRAFT);
        kycRequest.setTeacherProfile(teacherProfile);
        kycRequest.setEkycProvider(VNPT_PROVIDER);
        kycRequest.setProviderSessionId(blankToNull(request.providerSessionId()));
        kycRequest.setProviderTransactionId(blankToNull(request.providerTransactionId()));
        kycRequest.setIdentityStatus(verified ? IdentityVerificationStatus.VERIFIED : IdentityVerificationStatus.FAILED);
        kycRequest.setIdentityVerifiedAt(verified ? now : null);
        kycRequest.setCertificateStatus(verified ? CertificateVerificationStatus.NOT_SUBMITTED : CertificateVerificationStatus.LOCKED);
        kycRequest.setVerificationPayload(Map.of(
                "identityProvider", VNPT_PROVIDER,
                "providerResult", request.sdkResult() == null ? Map.of() : request.sdkResult(),
                "providerStatus", verified ? "SDK_VERIFIED" : "SDK_FAILED",
                "identityOcr", sdkDecision.identityOcr(),
                "failureReasons", sdkDecision.failureReasons(),
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
    public KycRestartVerificationResponse restartVerification(UUID userId, String ipAddress, String userAgent) {
        TeacherProfile teacherProfile = resolveTeacher(userId);
        AppUser user = teacherProfile.getUser();

        if (user.getUserStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(
                    MessageCodes.MSG_ADM_002,
                    "Teacher account is not allowed to restart verification",
                    HttpStatus.FORBIDDEN
            );
        }

        if (teacherProfile.getKycStatus() == TeacherKycStatus.APPROVED) {
            throw new BusinessException(
                    MessageCodes.KYC_ALREADY_APPROVED,
                    "Approved KYC cannot be restarted",
                    HttpStatus.CONFLICT
            );
        }

        TeacherKycStatus beforeStatus = teacherProfile.getKycStatus();
        KycRequest restartRequest = new KycRequest();
        restartRequest.setTeacherProfile(teacherProfile);
        restartRequest.setStatus(KycRequestStatus.DRAFT);
        restartRequest.setIdentityStatus(IdentityVerificationStatus.NOT_STARTED);
        restartRequest.setCertificateStatus(CertificateVerificationStatus.LOCKED);
        restartRequest.setCopyrightAgreed(false);
        restartRequest.setVerificationPayload(Map.of(
                "restart", true,
                "previousTeacherKycStatus", beforeStatus.name(),
                "moduleFlow", "FULL_RESTART",
                "srs", srsTrace()
        ));

        teacherProfile.setKycStatus(TeacherKycStatus.NOT_SUBMITTED);
        teacherProfile.setCanPublishCourse(false);

        KycRequest savedRequest = kycRequestRepository.save(restartRequest);
        boolean auditLogged = createRestartAudit(savedRequest, user, beforeStatus, ipAddress, userAgent);

        return new KycRestartVerificationResponse(
                teacherProfile.getId(),
                teacherProfile.getKycStatus().name(),
                teacherProfile.isCanPublishCourse(),
                toRequestResponse(savedRequest, List.of()),
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
                && resolvedIdentityStatus(latestRequest) == IdentityVerificationStatus.VERIFIED
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

        if (resolvedIdentityStatus(latestRequest) != IdentityVerificationStatus.VERIFIED) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "Identity verification must be successful before certificate submission"
            );
        }

        CertificateVerificationStatus certificateStatus = resolvedCertificateStatus(latestRequest);
        if (latestRequest.getStatus() == KycRequestStatus.PENDING
                || certificateStatus == CertificateVerificationStatus.PENDING_REVIEW) {
            throw new BusinessException(
                    MessageCodes.KYC_ALREADY_PENDING,
                    "Certificate is already waiting for registry matching",
                    HttpStatus.CONFLICT
            );
        }

        if (certificateStatus != CertificateVerificationStatus.NOT_SUBMITTED) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "Start a fresh teacher verification attempt before submitting another certificate"
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

    private boolean createRestartAudit(
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
        auditLog.setAction("KYC_RESTART_VERIFICATION");
        auditLog.setTargetType("KYC_REQUEST");
        auditLog.setTargetId(request.getId());
        auditLog.setBeforeValue(Map.of("teacherKycStatus", beforeStatus.name()));
        auditLog.setAfterValue(Map.of(
                "teacherKycStatus", TeacherKycStatus.NOT_SUBMITTED.name(),
                "requestStatus", request.getStatus().name(),
                "identityStatus", request.getIdentityStatus().name(),
                "certificateStatus", request.getCertificateStatus().name()
        ));
        auditLog.setMetadata(Map.of(
                "uc", "UC-22",
                "module", "FULL_RESTART",
                "reason", "Teacher requested fresh identity and certificate verification"
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
                resolvedIdentityStatus(request).name(),
                identityStatusLabel(resolvedIdentityStatus(request)),
                resolvedIdentityStatus(request) == IdentityVerificationStatus.VERIFIED ? request.getIdentityVerifiedAt() : null,
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

        IdentityVerificationStatus status = resolvedIdentityStatus(latestRequest);
        return new KycModuleStatusResponse(
                status.name(),
                identityStatusLabel(status),
                canInteractWithIdentityModule(teacherProfile, latestRequest),
                status == IdentityVerificationStatus.VERIFIED ? latestRequest.getIdentityVerifiedAt() : null,
                identityStatusDetail(status)
        );
    }

    private KycModuleStatusResponse certificateModuleStatus(TeacherProfile teacherProfile, KycRequest latestRequest) {
        if (latestRequest == null || resolvedIdentityStatus(latestRequest) != IdentityVerificationStatus.VERIFIED) {
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
                && status == CertificateVerificationStatus.NOT_SUBMITTED;

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

    private IdentityVerificationStatus resolvedIdentityStatus(KycRequest request) {
        if (request.getIdentityStatus() == IdentityVerificationStatus.NOT_STARTED
                || request.getIdentityStatus() == IdentityVerificationStatus.FAILED
                || request.getIdentityStatus() == IdentityVerificationStatus.PROCESSING) {
            return request.getIdentityStatus();
        }

        return VNPT_PROVIDER.equals(request.getEkycProvider())
                ? request.getIdentityStatus()
                : IdentityVerificationStatus.NOT_STARTED;
    }

    private boolean canInteractWithIdentityModule(TeacherProfile teacherProfile, KycRequest latestRequest) {
        if (teacherProfile.getKycStatus() == TeacherKycStatus.APPROVED) {
            return false;
        }

        IdentityVerificationStatus status = resolvedIdentityStatus(latestRequest);
        if (status == IdentityVerificationStatus.VERIFIED || status == IdentityVerificationStatus.PROCESSING) {
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

    private VnptSdkDecision evaluateSdkResult(Map<String, Object> sdkResult) {
        if (sdkResult == null || sdkResult.isEmpty()) {
            return new VnptSdkDecision(false, Map.of(), List.of("VNPT SDK did not return a result payload"));
        }

        List<ResultEntry> entries = flattenResult(sdkResult);
        boolean hasExplicitInvalid = entries.stream().anyMatch(this::isExplicitInvalidValue);
        Map<String, String> identityOcr = extractIdentityOcr(entries);
        boolean hasRequiredOcr = StringUtils.hasText(identityOcr.get("idNumber"))
                && StringUtils.hasText(identityOcr.get("fullName"));
        boolean hasFaceVerification = hasAcceptedFaceVerification(entries);

        java.util.ArrayList<String> failureReasons = new java.util.ArrayList<>();
        if (hasExplicitInvalid) {
            failureReasons.add("VNPT validation returned invalid document, mismatch, failed, or null result");
        }
        if (!hasRequiredOcr) {
            failureReasons.add("VNPT OCR did not return both CCCD number and full name");
        }
        if (!hasFaceVerification) {
            failureReasons.add("VNPT liveness/face compare result was not successful");
        }

        return new VnptSdkDecision(failureReasons.isEmpty(), identityOcr, failureReasons);
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

        if (isValidationKey(key) && value instanceof Boolean booleanValue && !booleanValue) {
            return true;
        }

        if (value instanceof String text) {
            String normalized = normalizeSearchText(text);
            return normalized.contains("khong hop le")
                    || normalized.contains("khong cung loai")
                    || normalized.contains("khong trung khop")
                    || normalized.contains("khong khop")
                    || normalized.contains("khong thanh cong")
                    || normalized.contains("that bai")
                    || normalized.contains("invalid")
                    || normalized.contains("not valid")
                    || normalized.contains("not same")
                    || normalized.contains("not match")
                    || normalized.contains("mismatch")
                    || normalized.contains("failed")
                    || normalized.contains("failure")
                    || normalized.contains("null%");
        }

        return false;
    }

    private boolean hasAcceptedFaceVerification(List<ResultEntry> entries) {
        boolean hasFaceSignal = entries.stream().anyMatch(entry -> isFaceVerificationKey(entry.key()));
        if (!hasFaceSignal) {
            return false;
        }

        return entries.stream()
                .filter(entry -> isFaceVerificationKey(entry.key()))
                .anyMatch(this::isExplicitSuccessValue);
    }

    private boolean isExplicitSuccessValue(ResultEntry entry) {
        Object value = entry.value();
        String key = entry.key();

        if (isValidationKey(key) && value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        if (value instanceof Number numberValue && isFaceVerificationKey(key)) {
            return numberValue.doubleValue() >= 80.0D;
        }

        if (value instanceof String text) {
            String normalized = normalizeSearchText(text);
            if (isFaceVerificationKey(key) && normalized.matches(".*\\b(8\\d|9\\d|100)(\\.\\d+)?\\s*%?.*")) {
                return true;
            }

            return normalized.equals("valid")
                    || normalized.equals("success")
                    || normalized.equals("verified")
                    || normalized.equals("matched")
                    || normalized.equals("match")
                    || normalized.equals("pass")
                    || normalized.contains("hop le")
                    || normalized.contains("thanh cong");
        }

        return false;
    }

    private Map<String, String> extractIdentityOcr(List<ResultEntry> entries) {
        Map<String, String> identityOcr = new LinkedHashMap<>();
        putIfPresent(identityOcr, "idNumber", findEntryValue(entries, "idnumber", "idno", "identitynumber", "documentnumber", "cardnumber", "socccd", "cccd", "soid", "id"));
        putIfPresent(identityOcr, "fullName", findEntryValue(entries, "fullname", "hoten", "name", "customername"));
        putIfPresent(identityOcr, "dateOfBirth", findEntryValue(entries, "dateofbirth", "birthdate", "birthday", "dob", "ngaysinh"));
        putIfPresent(identityOcr, "gender", findEntryValue(entries, "gender", "sex", "gioitinh"));
        putIfPresent(identityOcr, "address", findEntryValue(entries, "address", "residentaddress", "permanentaddress", "noithuongtru", "thuongtru"));
        return identityOcr;
    }

    private void putIfPresent(Map<String, String> target, String key, String value) {
        if (StringUtils.hasText(value)) {
            target.put(key, value);
        }
    }

    private String findEntryValue(List<ResultEntry> entries, String... aliases) {
        Set<String> normalizedAliases = java.util.Arrays.stream(aliases)
                .map(this::normalizeKey)
                .collect(java.util.stream.Collectors.toSet());

        return entries.stream()
                .filter(entry -> normalizedAliases.contains(normalizeKey(lastPathSegment(entry.key()))))
                .map(entry -> displayScalar(entry.value()))
                .filter(StringUtils::hasText)
                .findFirst()
                .orElseGet(() -> entries.stream()
                        .filter(entry -> normalizedAliases.stream().anyMatch(alias -> normalizeKey(entry.key()).endsWith(alias)))
                        .map(entry -> displayScalar(entry.value()))
                        .filter(StringUtils::hasText)
                        .findFirst()
                        .orElse(null));
    }

    private String displayScalar(Object value) {
        if (value instanceof String text) {
            String trimmed = text.trim();
            return trimmed.length() > 240 ? null : trimmed;
        }

        if (value instanceof Number number) {
            return String.valueOf(number);
        }

        return null;
    }

    private String lastPathSegment(String path) {
        int lastDot = path.lastIndexOf('.');
        return lastDot < 0 ? path : path.substring(lastDot + 1);
    }

    private boolean isValidationKey(String key) {
        String normalizedKey = normalizeKey(key);
        return normalizedKey.contains("success")
                || normalizedKey.contains("verified")
                || normalizedKey.contains("valid")
                || normalizedKey.contains("validation")
                || normalizedKey.contains("result")
                || normalizedKey.contains("status")
                || normalizedKey.contains("same")
                || normalizedKey.contains("match")
                || normalizedKey.contains("compare")
                || normalizedKey.contains("liveness");
    }

    private boolean isFaceVerificationKey(String key) {
        String normalizedKey = normalizeKey(key);
        return normalizedKey.contains("face")
                || normalizedKey.contains("liveness")
                || normalizedKey.contains("live")
                || normalizedKey.contains("compare")
                || normalizedKey.contains("comparison")
                || normalizedKey.contains("matching")
                || normalizedKey.contains("similarity")
                || normalizedKey.contains("portrait")
                || normalizedKey.contains("selfie");
    }

    private String normalizeKey(String value) {
        return java.text.Normalizer.normalize(value == null ? "" : value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]", "")
                .toLowerCase();
    }

    private String normalizeSearchText(String value) {
        return java.text.Normalizer.normalize(value == null ? "" : value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
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
            case PENDING_REVIEW -> "Đang chờ đối soát chứng chỉ";
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Bị từ chối";
        };
    }

    private String certificateStatusDetail(CertificateVerificationStatus status) {
        return switch (status) {
            case LOCKED -> "Hoàn tất xác thực danh tính trước khi nộp chứng chỉ.";
            case NOT_SUBMITTED -> "Nộp JLPT / J-Test / NAT-TEST Certificate và mã chứng chỉ bắt buộc.";
            case PENDING_REVIEW -> "Chứng chỉ đang chờ đối soát registry với thông tin chính chủ trên CCCD.";
            case APPROVED -> "Chứng chỉ đã khớp thông tin chính chủ và đạt yêu cầu.";
            case REJECTED -> "Chứng chỉ không khớp thông tin chính chủ trên CCCD. Giáo viên cần xác thực lại từ đầu.";
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

    private record VnptSdkDecision(
            boolean verified,
            Map<String, String> identityOcr,
            List<String> failureReasons
    ) {
    }
}
