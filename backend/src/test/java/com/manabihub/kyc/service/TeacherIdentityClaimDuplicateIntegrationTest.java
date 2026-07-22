package com.manabihub.kyc.service;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.audit.service.SecurityAuditService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherIdentityClaim;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.dto.KycIdentityVerificationRequest;
import com.manabihub.kyc.dto.KycIdentityVerificationResponse;
import com.manabihub.kyc.port.JlptRegistryPort;
import com.manabihub.kyc.port.NationalIdRecordDto;
import com.manabihub.kyc.port.NationalIdRegistryPort;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherIdentityClaimRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherIdentityClaimDuplicateIntegrationTest {

    @Mock
    private TeacherProfileRepository teacherProfileRepository;
    @Mock
    private KycRequestRepository kycRequestRepository;
    @Mock
    private KycDocumentRepository kycDocumentRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private NationalIdRegistryPort nationalIdRegistryPort;
    @Mock
    private JlptRegistryPort jlptRegistryPort;
    @Mock
    private TeacherIdentityClaimRepository claimRepository;
    @Mock
    private EntityManager entityManager;

    private TeacherIdentityClaimService claimService;
    private SecurityAuditService securityAuditService;
    private TeacherKycService teacherKycService;

    private UUID userAId;
    private UUID teacherAId;
    private UUID userBId;
    private UUID teacherBId;

    @BeforeEach
    void setUp() {
        userAId = UUID.randomUUID();
        teacherAId = UUID.randomUUID();
        userBId = UUID.randomUUID();
        teacherBId = UUID.randomUUID();

        securityAuditService = new SecurityAuditService(auditLogRepository);
        claimService = new TeacherIdentityClaimService(claimRepository, securityAuditService, "test-secret-123");
        teacherKycService = new TeacherKycService(
                teacherProfileRepository,
                kycRequestRepository,
                kycDocumentRepository,
                auditLogRepository,
                nationalIdRegistryPort,
                jlptRegistryPort,
                claimService,
                entityManager,
                "storage/kyc"
        );
    }

    private KycIdentityVerificationRequest createMockSdkRequest(String idNumber, String name, String dob) {
        Map<String, Object> sdkResult = Map.of(
                "idNumber", idNumber,
                "fullName", name,
                "dateOfBirth", dob,
                "liveness", "success",
                "faceMatch", true
        );
        return new KycIdentityVerificationRequest("session-1", "tx-1", sdkResult);
    }

    @Test
    void testDuplicateCccdProtectionAndAuditWorkflow() {
        String cccdRaw = "099 888 777 666";
        String cccdNormalized = "099888777666";

        // Setup Teacher A
        AppUser userA = new AppUser();
        userA.setId(userAId);
        userA.setFullName("Nguyen Van A");
        userA.setUserStatus(UserStatus.ACTIVE);

        TeacherProfile profileA = new TeacherProfile();
        profileA.setId(teacherAId);
        profileA.setUser(userA);
        profileA.setKycStatus(TeacherKycStatus.NOT_SUBMITTED);
        profileA.setCanPublishCourse(false);

        when(teacherProfileRepository.findByUserId(userAId)).thenReturn(Optional.of(profileA));
        when(nationalIdRegistryPort.findActiveByIdNumber(cccdRaw))
                .thenReturn(Optional.of(new NationalIdRecordDto(cccdNormalized, "Nguyen Van A", LocalDate.of(1990, 1, 1))));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherAId)).thenReturn(Optional.empty());
        when(kycRequestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // 1. Teacher A verifies identity with CCCD "099 888 777 666" -> Succeeds & saves claim
        KycIdentityVerificationRequest reqA = createMockSdkRequest(cccdRaw, "Nguyen Van A", "01/01/1990");
        KycIdentityVerificationResponse respA = teacherKycService.verifyIdentity(userAId, reqA, "127.0.0.1", "TestAgent");

        assertNotNull(respA);
        verify(claimRepository).saveAndFlush(any());

        // 2. Setup Teacher B trying to use same CCCD with dashes "099-888-777-666"
        AppUser userB = new AppUser();
        userB.setId(userBId);
        userB.setFullName("Nguyen Van B");
        userB.setUserStatus(UserStatus.ACTIVE);

        TeacherProfile profileB = new TeacherProfile();
        profileB.setId(teacherBId);
        profileB.setUser(userB);
        profileB.setKycStatus(TeacherKycStatus.NOT_SUBMITTED);
        profileB.setCanPublishCourse(false);

        String fingerprint = claimService.generateFingerprint(cccdNormalized);
        TeacherIdentityClaim claimTeacherA = TeacherIdentityClaim.builder()
                .teacherId(teacherAId)
                .identityFingerprint(fingerprint)
                .build();

        when(teacherProfileRepository.findByUserId(userBId)).thenReturn(Optional.of(profileB));
        when(nationalIdRegistryPort.findActiveByIdNumber("099-888-777-666"))
                .thenReturn(Optional.of(new NationalIdRecordDto(cccdNormalized, "Nguyen Van B", LocalDate.of(1990, 1, 1))));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherBId)).thenReturn(Optional.empty());
        when(claimRepository.findByIdentityFingerprint(fingerprint)).thenReturn(Optional.of(claimTeacherA));

        KycIdentityVerificationRequest reqB = createMockSdkRequest("099-888-777-666", "Nguyen Van B", "01/01/1990");

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> teacherKycService.verifyIdentity(userBId, reqB, "127.0.0.1", "TestAgent")
        );

        // Assert HTTP 409 Conflict + MSG-KYC-008
        assertEquals(MessageCodes.MSG_KYC_008, ex.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, ex.getHttpStatus());

        // Assert Teacher B's profile was NOT approved
        assertFalse(profileB.isCanPublishCourse());
        assertEquals(TeacherKycStatus.NOT_SUBMITTED, profileB.getKycStatus());

        // Assert auditLogRepository saved duplicate security audit event
        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, atLeastOnce()).save(auditCaptor.capture());

        AuditLog duplicateAudit = auditCaptor.getAllValues().stream()
                .filter(a -> "KYC_DUPLICATE_IDENTITY_DETECTED".equals(a.getAction()))
                .findFirst()
                .orElse(null);

        assertNotNull(duplicateAudit, "Security audit log must be recorded for duplicate identity detection");
        assertEquals(userBId, duplicateAudit.getActorUserId());
        assertEquals("TEACHER", duplicateAudit.getActorRoleCode());
        assertFalse(duplicateAudit.getAfterValue().toString().contains(cccdNormalized), "Audit log must NOT contain raw CCCD");
    }
}
