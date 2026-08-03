package com.manabihub.kyc.service;

import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.CertificateVerificationStatus;
import com.manabihub.kyc.domain.IdentityVerificationStatus;
import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.KycRequestStatus;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.dto.KycCertificateSubmissionResponse;
import com.manabihub.kyc.dto.KycIdentityVerificationRequest;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.port.VnptServerVerificationResult;
import com.manabihub.kyc.port.VnptVerificationPort;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.security.service.PublicJwtTokenService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherKycServiceTest {

    @Mock
    private TeacherProfileRepository teacherProfileRepository;
    @Mock
    private KycRequestRepository kycRequestRepository;
    @Mock
    private KycDocumentRepository kycDocumentRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private TeacherIdentityClaimService teacherIdentityClaimService;
    @Mock
    private TeacherCertificateClaimService teacherCertificateClaimService;
    @Mock
    private PublicJwtTokenService publicJwtTokenService;
    @Mock
    private EntityManager entityManager;
    @Mock
    private Query countQuery;
    @Mock
    private Query insertQuery;
    @Mock
    private VnptVerificationPort vnptVerificationPort;

    @TempDir
    private Path storageRoot;

    private TeacherKycService teacherKycService;
    private AppUser user;
    private TeacherProfile teacher;
    private KycRequest identityVerifiedRequest;

    @BeforeEach
    void setUp() {
        teacherKycService = new TeacherKycService(
                teacherProfileRepository,
                kycRequestRepository,
                kycDocumentRepository,
                auditLogRepository,
                notificationRepository,
                teacherIdentityClaimService,
                teacherCertificateClaimService,
                publicJwtTokenService,
                vnptVerificationPort,
                entityManager,
                storageRoot.toString()
        );

        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("teacher@example.com");
        user.setFullName("Nguyen Van A");
        user.setUserStatus(UserStatus.ACTIVE);

        teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(user);
        teacher.setKycStatus(TeacherKycStatus.NOT_SUBMITTED);
        teacher.setCanPublishCourse(false);

        identityVerifiedRequest = new KycRequest();
        identityVerifiedRequest.setId(UUID.randomUUID());
        identityVerifiedRequest.setTeacherProfile(teacher);
        identityVerifiedRequest.setStatus(KycRequestStatus.DRAFT);
        identityVerifiedRequest.setEkycProvider("VNPT_EKYC_WEB_SDK");
        identityVerifiedRequest.setIdentityStatus(IdentityVerificationStatus.VERIFIED);
        identityVerifiedRequest.setCertificateStatus(CertificateVerificationStatus.NOT_SUBMITTED);
        identityVerifiedRequest.setIdentityVerifiedAt(Instant.now());
        identityVerifiedRequest.setVerificationPayload(Map.of(
                "providerStatus", "SDK_VERIFIED",
                "identityOcr", Map.of(
                        "idNumber", "012345678901",
                        "fullName", "Nguyen Van A",
                        "dateOfBirth", "1990-01-02"
                )
        ));
        lenient().when(teacherCertificateClaimService.normalizeJlptCertificateCode(anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0, String.class)
                        .replaceAll("[^A-Za-z0-9]", "")
                        .toUpperCase());
    }

    @Test
    void getStatus_returnsApprovedTeacherState() {
        teacher.setKycStatus(TeacherKycStatus.APPROVED);
        teacher.setCanPublishCourse(true);
        when(teacherProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(teacher));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.empty());

        KycStatusResponse response = teacherKycService.getStatus(user.getId());

        assertEquals("APPROVED", response.teacherKycStatus());
        assertTrue(response.canPublishCourse());
    }

    @Test
    void getStatus_createsCandidateProfileWhenMissing() {
        when(teacherProfileRepository.findByUserId(user.getId()))
                .thenReturn(Optional.empty(), Optional.of(teacher));
        when(teacherProfileRepository.createCandidateIfAbsent(any(UUID.class), eq(user.getId())))
                .thenReturn(1);
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.empty());

        KycStatusResponse response = teacherKycService.getStatus(user.getId());

        assertEquals("NOT_SUBMITTED", response.teacherKycStatus());
        assertFalse(response.canPublishCourse());
    }

    @Test
    void verifyIdentity_claimsCccdOnlyAfterVnptReturnsNameDobAndFaceSuccess() {
        when(teacherProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(teacher));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.empty());
        when(teacherIdentityClaimService.normalizeCccd("012345678901"))
                .thenReturn("012345678901");
        when(kycRequestRepository.save(any(KycRequest.class))).thenAnswer(invocation -> {
            KycRequest request = invocation.getArgument(0);
            request.setId(UUID.randomUUID());
            return request;
        });
        when(kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(any()))
                .thenReturn(List.of());
        Map<String, Object> sdkResult = Map.of(
                "object", Map.of("idNumber", "012345678901", "name", "Nguyen Van A", "dateOfBirth", "01/01/1990"),
                "compare", Map.of("result", true, "msg", "Khuôn mặt hợp lệ", "prob", 99),
                "liveness", Map.of("liveness_result", true, "liveness_msg", "Thành công")
        );

        when(vnptVerificationPort.verifyTransaction(any(), any()))
                .thenReturn(VnptServerVerificationResult.success("transaction", "SUCCESS", "2023-01-01T00:00:00Z", "012345678901", "ref"));

        var response = teacherKycService.verifyIdentity(
                user.getId(),
                new KycIdentityVerificationRequest("session", "transaction", sdkResult),
                "127.0.0.1",
                "JUnit"
        );

        assertEquals("VERIFIED", response.request().identityStatus());
        verify(teacherIdentityClaimService).processIdentityClaim(
                teacher.getId(),
                "012345678901",
                user,
                "127.0.0.1",
                "JUnit"
        );
    }

    @Test
    void submitCertificate_entersManualReviewAndGrantsTeacherWorkspace() {
        prepareCertificateSubmission();
        when(teacherCertificateClaimService.processCertificateClaim(
                eq(teacher.getId()),
                eq(identityVerifiedRequest.getId()),
                eq("JLPT2026001"),
                eq(user),
                anyString(),
                anyString()
        )).thenReturn("JLPT2026001");
        when(publicJwtTokenService.issueCurrentRoleToken(user.getId()))
                .thenReturn("fresh-teacher-token");

        KycCertificateSubmissionResponse response = teacherKycService.submitCertificate(
                user.getId(),
                validPng(),
                "JLPT-2026-001",
                "Nguyen Van A",
                "1990-01-02",
                "N2",
                "Name Nguyen Van A Date of Birth 1990-01-02 Level N2 Certificate JLPT-2026-001",
                true,
                "127.0.0.1",
                "JUnit"
        );

        assertEquals("PENDING", response.teacherKycStatus());
        assertFalse(response.canPublishCourse());
        assertTrue(response.teacherWorkspaceAvailable());
        assertEquals("fresh-teacher-token", response.sessionToken());
        assertEquals(KycRequestStatus.PENDING, identityVerifiedRequest.getStatus());
        assertEquals(
                CertificateVerificationStatus.PENDING_REVIEW,
                identityVerifiedRequest.getCertificateStatus()
        );
        verify(entityManager).createNativeQuery(startsWith("INSERT INTO user_roles"));
        verify(teacherProfileRepository).save(teacher);
    }

    @Test
    void submitCertificate_rejectsNameMismatchBeforeClaimOrFileStorage() {
        when(teacherProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(teacher));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.of(identityVerifiedRequest));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> teacherKycService.submitCertificate(
                        user.getId(),
                        validPng(),
                        "JLPT-2026-001",
                        "Tran Van B",
                        "1990-01-02",
                        "N2",
                        "Name Tran Van B Date of Birth 1990-01-02 Level N2 Certificate JLPT-2026-001",
                        true,
                        "127.0.0.1",
                        "JUnit"
                )
        );

        assertEquals(MessageCodes.KYC_CERTIFICATE_OCR_MISMATCH, exception.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(teacherCertificateClaimService, never()).processCertificateClaim(
                any(), any(), anyString(), any(), anyString(), anyString()
        );
        verify(kycDocumentRepository, never()).save(any());
    }

    @Test
    void submitCertificate_rejectsCertificateCodeThatWasNotReadFromImage() {
        when(teacherProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(teacher));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.of(identityVerifiedRequest));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> teacherKycService.submitCertificate(
                        user.getId(),
                        validPng(),
                        "JLPT-2026-001",
                        "Nguyen Van A",
                        "1990-01-02",
                        "N2",
                        "Name Nguyen Van A Date of Birth 1990-01-02 Level N2 Certificate OTHER-999",
                        true,
                        "127.0.0.1",
                        "JUnit"
                )
        );

        assertEquals(MessageCodes.KYC_CERTIFICATE_OCR_MISMATCH, exception.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(teacherCertificateClaimService, never()).processCertificateClaim(
                any(), any(), anyString(), any(), anyString(), anyString()
        );
        verify(kycDocumentRepository, never()).save(any());
    }

    @Test
    void submitCertificate_propagatesDuplicateJlptConflict() {
        when(teacherProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(teacher));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.of(identityVerifiedRequest));
        when(teacherCertificateClaimService.processCertificateClaim(
                any(), any(), anyString(), any(), anyString(), anyString()
        )).thenThrow(new BusinessException(
                MessageCodes.KYC_CERTIFICATE_ALREADY_CLAIMED,
                "Duplicate JLPT",
                HttpStatus.CONFLICT
        ));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> teacherKycService.submitCertificate(
                        user.getId(),
                        validPng(),
                        "JLPT-2026-001",
                        "Nguyen Van A",
                        "1990-01-02",
                        "N2",
                        "Name Nguyen Van A Date of Birth 1990-01-02 Level N2 Certificate JLPT-2026-001",
                        true,
                        "127.0.0.1",
                        "JUnit"
                )
        );

        assertEquals(MessageCodes.KYC_CERTIFICATE_ALREADY_CLAIMED, exception.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        verify(kycDocumentRepository, never()).save(any());
    }

    private void prepareCertificateSubmission() {
        when(teacherProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(teacher));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacher.getId()))
                .thenReturn(Optional.of(identityVerifiedRequest));
        when(kycRequestRepository.saveAndFlush(identityVerifiedRequest))
                .thenReturn(identityVerifiedRequest);
        when(kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(identityVerifiedRequest.getId()))
                .thenAnswer(invocation -> List.of());
        when(notificationRepository.findActiveAdminIdsByRoleCode("COURSE_MANAGER"))
                .thenReturn(List.of(UUID.randomUUID()));
        when(entityManager.createNativeQuery(startsWith("SELECT COUNT(*) FROM user_roles")))
                .thenReturn(countQuery);
        when(countQuery.setParameter(anyString(), any())).thenReturn(countQuery);
        when(countQuery.getSingleResult()).thenReturn(0L);
        when(entityManager.createNativeQuery(startsWith("INSERT INTO user_roles")))
                .thenReturn(insertQuery);
        when(insertQuery.setParameter(anyString(), any())).thenReturn(insertQuery);
        when(insertQuery.executeUpdate()).thenReturn(1);
    }

    private MockMultipartFile validPng() {
        byte[] bytes = new byte[] {
                (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01
        };
        return new MockMultipartFile(
                "certificate",
                "jlpt.png",
                "image/png",
                bytes
        );
    }
}
