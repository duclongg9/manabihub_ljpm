package com.manabihub.kyc.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.AuditLog;
import com.manabihub.kyc.domain.InternalAdminAccount;
import com.manabihub.kyc.domain.KycDocument;
import com.manabihub.kyc.domain.KycDocumentType;
import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.KycRequestStatus;
import com.manabihub.kyc.domain.Notification;
import com.manabihub.kyc.domain.RiskLevel;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.dto.KycDocumentResponse;
import com.manabihub.kyc.dto.KycRequestResponse;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.dto.KycSubmissionResponse;
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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class TeacherKycService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> IMAGE_MIME_TYPES = Set.of("image/jpeg", "image/png");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> DOCUMENT_MIME_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");
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
        KycRequestResponse latestRequest = kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherProfile.getId())
                .map(this::toRequestResponse)
                .orElse(null);

        return new KycStatusResponse(
                teacherProfile.getId(),
                teacherProfile.getUser().getId(),
                teacherProfile.getKycStatus().name(),
                statusLabel(teacherProfile.getKycStatus()),
                teacherProfile.isCanPublishCourse(),
                latestRequest,
                srsTrace()
        );
    }

    @Transactional
    public KycSubmissionResponse submit(
            UUID userId,
            MultipartFile cccdFront,
            MultipartFile cccdBack,
            MultipartFile selfie,
            MultipartFile certificate,
            MultipartFile copyrightAgreement,
            boolean copyrightAgreementAccepted,
            String certificateCode,
            String ipAddress,
            String userAgent
    ) {
        TeacherProfile teacherProfile = resolveTeacher(userId);
        AppUser user = teacherProfile.getUser();
        validateSubmissionAllowed(user, teacherProfile);
        validateAgreement(copyrightAgreementAccepted);

        PreparedFile frontFile = prepareFile(cccdFront, KycDocumentType.ID_CARD_FRONT);
        PreparedFile backFile = prepareFile(cccdBack, KycDocumentType.ID_CARD_BACK);
        PreparedFile selfieFile = prepareFile(selfie, KycDocumentType.SELFIE);
        PreparedFile certificateFile = prepareFile(certificate, KycDocumentType.CERTIFICATE);
        PreparedFile copyrightAgreementFile = prepareFile(copyrightAgreement, KycDocumentType.COPYRIGHT_AGREEMENT);

        validateDuplicateIdentityDocuments(teacherProfile, frontFile, backFile, user, ipAddress, userAgent);

        KycRequest kycRequest = new KycRequest();
        kycRequest.setTeacherProfile(teacherProfile);
        kycRequest.setStatus(KycRequestStatus.PENDING);
        kycRequest.setEkycProvider("MANUAL_REVIEW");
        kycRequest.setRiskLevel(RiskLevel.MEDIUM);
        kycRequest.setCertificateCode(StringUtils.hasText(certificateCode) ? certificateCode.trim() : null);
        kycRequest.setCopyrightAgreed(true);
        kycRequest.setVerificationPayload(Map.of(
                "providerStatus", "ADAPTER_DEFERRED_TO_MHB_12",
                "adminReviewRequired", true,
                "autoApproval", false,
                "srs", srsTrace()
        ));
        KycRequest savedRequest = kycRequestRepository.save(kycRequest);
        savedRequest.setEkycReferenceId("MHB-KYC-" + savedRequest.getId());

        List<KycDocument> documents = List.of(
                storeDocument(savedRequest, frontFile),
                storeDocument(savedRequest, backFile),
                storeDocument(savedRequest, selfieFile),
                storeDocument(savedRequest, certificateFile),
                storeDocument(savedRequest, copyrightAgreementFile)
        );
        kycDocumentRepository.saveAll(documents);

        TeacherKycStatus beforeStatus = teacherProfile.getKycStatus();
        teacherProfile.setKycStatus(TeacherKycStatus.PENDING);
        teacherProfile.setCanPublishCourse(false);

        boolean adminNotificationCreated = createAdminNotifications(savedRequest, teacherProfile, user);
        boolean auditLogged = createSubmissionAudit(savedRequest, user, beforeStatus, ipAddress, userAgent);

        return new KycSubmissionResponse(
                teacherProfile.getId(),
                teacherProfile.getKycStatus().name(),
                teacherProfile.isCanPublishCourse(),
                toRequestResponse(savedRequest, documents),
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

    private void validateSubmissionAllowed(AppUser user, TeacherProfile teacherProfile) {
        if (user.getUserStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(
                    MessageCodes.MSG_ADM_002,
                    "Teacher account is not allowed to submit KYC documents",
                    HttpStatus.FORBIDDEN
            );
        }

        if (teacherProfile.getKycStatus() == TeacherKycStatus.PENDING) {
            throw new BusinessException(
                    MessageCodes.KYC_ALREADY_PENDING,
                    "KYC request is already pending admin review",
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

        if (!Set.of(TeacherKycStatus.NOT_SUBMITTED, TeacherKycStatus.REJECTED, TeacherKycStatus.CORRECTION_REQUIRED)
                .contains(teacherProfile.getKycStatus())) {
            throw new BusinessException(
                    MessageCodes.KYC_SUBMISSION_NOT_ALLOWED,
                    "Teacher current KYC status does not allow submission",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validateAgreement(boolean accepted) {
        if (!accepted) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_002,
                    "Digital Copyright Liability Agreement must be accepted"
            );
        }
    }

    private PreparedFile prepareFile(MultipartFile file, KycDocumentType documentType) {
        if (file == null || file.isEmpty()) {
            throw invalidFile(documentType, "Required file is missing");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw invalidFile(documentType, "File must not exceed 5MB");
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String extension = extensionOf(originalFileName);
        String mimeType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        boolean documentFile = documentType == KycDocumentType.CERTIFICATE || documentType == KycDocumentType.COPYRIGHT_AGREEMENT;
        Set<String> allowedMimeTypes = documentFile ? DOCUMENT_MIME_TYPES : IMAGE_MIME_TYPES;
        Set<String> allowedExtensions = documentFile ? DOCUMENT_EXTENSIONS : IMAGE_EXTENSIONS;

        if (!allowedMimeTypes.contains(mimeType) && !allowedExtensions.contains(extension)) {
            throw invalidFile(documentType, "File type must be JPG, PNG, or PDF where allowed");
        }

        try {
            byte[] bytes = file.getBytes();
            String hash = sha256(bytes);

            return new PreparedFile(documentType, originalFileName, mimeType, file.getSize(), hash, bytes);
        } catch (IOException ex) {
            throw invalidFile(documentType, "Could not read uploaded file");
        }
    }

    private void validateDuplicateIdentityDocuments(
            TeacherProfile teacherProfile,
            PreparedFile frontFile,
            PreparedFile backFile,
            AppUser user,
            String ipAddress,
            String userAgent
    ) {
        if (frontFile.fileHash().equals(backFile.fileHash())
                || kycDocumentRepository.existsIdentityHashForOtherTeacher(frontFile.fileHash(), teacherProfile.getId())
                || kycDocumentRepository.existsIdentityHashForOtherTeacher(backFile.fileHash(), teacherProfile.getId())) {
            createSecurityAudit(user, teacherProfile, frontFile.fileHash(), backFile.fileHash(), ipAddress, userAgent);
            throw new BusinessException(
                    MessageCodes.MSG_KYC_008,
                    "Duplicate identity document was detected",
                    HttpStatus.CONFLICT
            );
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

    private boolean createAdminNotifications(KycRequest request, TeacherProfile teacherProfile, AppUser user) {
        List<InternalAdminAccount> admins = internalAdminAccountRepository.findActiveAdminsByRoleCodes(ADMIN_NOTIFICATION_ROLE_CODES);

        if (admins.isEmpty()) {
            return false;
        }

        List<Notification> notifications = admins.stream().map(admin -> {
            Notification notification = new Notification();
            notification.setRecipientAdmin(admin);
            notification.setTitle("New teacher KYC request");
            notification.setMessage("Teacher " + user.getFullName() + " submitted KYC request " + request.getId() + " for admin review.");
            notification.setNotificationType("KYC_REVIEW_REQUESTED");
            notification.setRead(false);
            return notification;
        }).toList();

        notificationRepository.saveAll(notifications);
        return true;
    }

    private boolean createSubmissionAudit(
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
        auditLog.setAction("KYC_SUBMIT");
        auditLog.setTargetType("KYC_REQUEST");
        auditLog.setTargetId(request.getId());
        auditLog.setBeforeValue(Map.of("teacherKycStatus", beforeStatus.name()));
        auditLog.setAfterValue(Map.of(
                "teacherKycStatus", TeacherKycStatus.PENDING.name(),
                "requestStatus", request.getStatus().name(),
                "documentTypes", List.of("ID_CARD_FRONT", "ID_CARD_BACK", "SELFIE", "CERTIFICATE", "COPYRIGHT_AGREEMENT")
        ));
        auditLog.setMetadata(Map.of(
                "uc", "UC-22",
                "br", List.of("BR-KYC-01", "BR-KYC-03", "BR-NOTIF-02", "BR-AUD-01"),
                "msg", MessageCodes.MSG_KYC_003,
                "providerAdapterScope", "MHB-12"
        ));
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLogRepository.save(auditLog);
        return true;
    }

    private void createSecurityAudit(
            AppUser user,
            TeacherProfile teacherProfile,
            String frontHash,
            String backHash,
            String ipAddress,
            String userAgent
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActorType("USER");
        auditLog.setActorUserId(user.getId());
        auditLog.setActorRoleCode("TEACHER");
        auditLog.setAction("KYC_DUPLICATE_IDENTITY_DOCUMENT_BLOCKED");
        auditLog.setTargetType("TEACHER_PROFILE");
        auditLog.setTargetId(teacherProfile.getId());
        auditLog.setMetadata(Map.of(
                "uc", "UC-22",
                "msg", MessageCodes.MSG_KYC_008,
                "frontHash", frontHash,
                "backHash", backHash
        ));
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLogRepository.save(auditLog);
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

    private BusinessException invalidFile(KycDocumentType documentType, String reason) {
        return new BusinessException(
                MessageCodes.MSG_KYC_002,
                documentType.name() + ": " + reason
        );
    }

    private String sanitizeFileName(String value) {
        String cleanName = StringUtils.cleanPath(value == null ? "kyc-document" : value);
        String fileName = Path.of(cleanName).getFileName().toString().replaceAll("[^A-Za-z0-9._-]", "_");

        return fileName.isBlank() ? "kyc-document" : fileName;
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

    private String statusLabel(TeacherKycStatus status) {
        return switch (status) {
            case NOT_SUBMITTED -> "Not Submitted";
            case PENDING -> "Pending Admin Review";
            case APPROVED -> "Approved";
            case REJECTED -> "Rejected";
            case CORRECTION_REQUIRED -> "Correction Required";
        };
    }

    private String requestStatusLabel(KycRequestStatus status) {
        return switch (status) {
            case PENDING -> "Pending Admin Review";
            case APPROVED -> "Approved";
            case REJECTED -> "Rejected";
            case CORRECTION_REQUIRED -> "Correction Required";
        };
    }

    private Map<String, Object> srsTrace() {
        return Map.of(
                "uc", "UC-22",
                "br", List.of("BR-KYC-01", "BR-KYC-03", "BR-KYC-05", "BR-NOTIF-02", "BR-AUD-01"),
                "msg", List.of(MessageCodes.MSG_KYC_003, MessageCodes.MSG_KYC_002, MessageCodes.MSG_KYC_008),
                "deferredToMhb12", List.of("VNPT eKYC adapter", "National ID registry adapter", "JLPT registry adapter")
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
}
