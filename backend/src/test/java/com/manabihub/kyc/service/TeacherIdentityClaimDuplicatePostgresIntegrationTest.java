package com.manabihub.kyc.service;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.IdentityVerificationStatus;
import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.KycRequestStatus;
import com.manabihub.kyc.domain.TeacherIdentityClaim;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.dto.KycIdentityVerificationRequest;
import com.manabihub.kyc.dto.KycIdentityVerificationResponse;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.port.NationalIdRecordDto;
import com.manabihub.kyc.port.NationalIdRegistryPort;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherIdentityClaimRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration",
        "manabihub.kyc.identity-secret=test-only-identity-secret-key-32chars-minimum-length"
})
class TeacherIdentityClaimDuplicatePostgresIntegrationTest {

    @Autowired
    private TeacherKycService teacherKycService;

    @Autowired
    private TeacherIdentityClaimService claimService;

    @Autowired
    private TeacherIdentityClaimBackfillRunner backfillRunner;

    @Autowired
    private TeacherIdentityClaimRepository claimRepository;

    @Autowired
    private TeacherProfileRepository teacherProfileRepository;

    @Autowired
    private KycRequestRepository kycRequestRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @MockBean
    private NationalIdRegistryPort nationalIdRegistryPort;

    private String cccdRawWithSpaces;
    private String cccdNormalized;

    @BeforeEach
    void setUp() {
        cccdRawWithSpaces = "099 888 777 666";
        cccdNormalized = "099888777666";

        // Registry always receives clean 12-digit string
        when(nationalIdRegistryPort.findActiveByIdNumber(eq(cccdNormalized)))
                .thenReturn(Optional.of(new NationalIdRecordDto(cccdNormalized, "Nguyen Van A", LocalDate.of(1990, 1, 1))));
    }

    private AppUser createTestUser(String email, String fullName) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setFullName(fullName);
        user.setProvider("LOCAL");
        user.setUserStatus(UserStatus.ACTIVE);
        entityManager.persist(user);
        return user;
    }

    private TeacherProfile createTestProfile(AppUser user) {
        TeacherProfile profile = new TeacherProfile();
        profile.setId(UUID.randomUUID());
        profile.setUser(user);
        profile.setDisplayName(user.getFullName());
        profile.setKycStatus(TeacherKycStatus.NOT_SUBMITTED);
        profile.setCanPublishCourse(false);
        return teacherProfileRepository.save(profile);
    }

    private KycIdentityVerificationRequest createMockSdkRequest(String idNumber, String name) {
        Map<String, Object> sdkResult = Map.of(
                "idNumber", idNumber,
                "fullName", name,
                "dateOfBirth", "01/01/1990",
                "liveness", "success",
                "faceMatch", true
        );
        return new KycIdentityVerificationRequest("sess-1", "tx-1", sdkResult);
    }

    @Test
    void testEndToEndDuplicateProtectionAndAuditPersistence() {
        TransactionTemplate tx1 = new TransactionTemplate(transactionManager);
        tx1.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // 1. Teacher A registers identity with formatted CCCD ("099 888 777 666") in TX 1
        UUID userAId = tx1.execute(status -> {
            AppUser userA = createTestUser("teacherA@test.com", "Nguyen Van A");
            TeacherProfile profileA = createTestProfile(userA);

            KycIdentityVerificationRequest reqA = createMockSdkRequest(cccdRawWithSpaces, "Nguyen Van A");
            KycIdentityVerificationResponse respA = teacherKycService.verifyIdentity(userA.getId(), reqA, "127.0.0.1", "TestAgent");

            assertNotNull(respA);
            assertTrue(claimRepository.findByTeacherId(profileA.getId()).isPresent());
            return userA.getId();
        });

        // Verify registry received clean 12-digit string
        verify(nationalIdRegistryPort).findActiveByIdNumber(cccdNormalized);

        // 2. Teacher A retries with same CCCD -> Idempotent success
        tx1.executeWithoutResult(status -> {
            KycIdentityVerificationRequest reqA = createMockSdkRequest(cccdNormalized, "Nguyen Van A");
            KycIdentityVerificationResponse retryRespA = teacherKycService.verifyIdentity(userAId, reqA, "127.0.0.1", "TestAgent");
            assertNotNull(retryRespA);
        });

        // 3. Teacher B attempts to use Teacher A's CCCD in separate TX 2
        TransactionTemplate tx2 = new TransactionTemplate(transactionManager);
        tx2.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        UUID teacherBId = tx2.execute(status -> {
            AppUser userB = createTestUser("teacherB@test.com", "Nguyen Van A");
            TeacherProfile profileB = createTestProfile(userB);

            KycIdentityVerificationRequest reqB = createMockSdkRequest("099-888-777-666", "Nguyen Van A");

            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> teacherKycService.verifyIdentity(userB.getId(), reqB, "127.0.0.1", "TestAgent")
            );

            // Assert 409 Conflict + MSG-KYC-008
            assertEquals(MessageCodes.MSG_KYC_008, ex.getMessageCode());
            assertEquals(HttpStatus.CONFLICT, ex.getHttpStatus());

            // Assert Teacher B state protected: profile NOT approved, canPublishCourse remains false
            TeacherProfile reloadedB = teacherProfileRepository.findById(profileB.getId()).orElseThrow();
            assertFalse(reloadedB.isCanPublishCourse());
            assertEquals(TeacherKycStatus.NOT_SUBMITTED, reloadedB.getKycStatus());

            // Force rollback of TX 2
            status.setRollbackOnly();
            return profileB.getId();
        });

        // 4. Assert Security Audit Log committed & persisted in DB despite TX 2 rollback!
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        AuditLog duplicateAudit = auditLogs.stream()
                .filter(a -> "KYC_DUPLICATE_IDENTITY_DETECTED".equals(a.getAction()))
                .filter(a -> teacherBId.equals(a.getTargetId()))
                .findFirst()
                .orElse(null);

        assertNotNull(duplicateAudit, "Security audit log (REQUIRES_NEW) must persist after outer transaction rollback");
        assertEquals("TEACHER", duplicateAudit.getActorRoleCode());
        assertFalse(duplicateAudit.getAfterValue().toString().contains(cccdNormalized), "Audit log must NOT leak raw CCCD");
    }

    @Test
    void testDirectDatabaseUniqueConstraintViolationHandling() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        tx.executeWithoutResult(status -> {
            AppUser userA = createTestUser("user1@test.com", "User 1");
            TeacherProfile profileA = createTestProfile(userA);

            String fingerprint = claimService.generateFingerprint("111222333444");

            TeacherIdentityClaim claim1 = TeacherIdentityClaim.builder()
                    .teacherId(profileA.getId())
                    .identityFingerprint(fingerprint)
                    .build();
            claimRepository.saveAndFlush(claim1);

            AppUser userB = createTestUser("user2@test.com", "User 2");
            TeacherProfile profileB = createTestProfile(userB);

            // Directly save conflicting claim in DB to trigger UK constraint
            TeacherIdentityClaim claim2 = TeacherIdentityClaim.builder()
                    .teacherId(profileB.getId())
                    .identityFingerprint(fingerprint)
                    .build();

            assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> {
                claimRepository.saveAndFlush(claim2);
            });

            status.setRollbackOnly();
        });
    }

    @Test
    void testHistoricalBackfillQuarantinesLegacyDuplicateCCCDs() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        tx.executeWithoutResult(status -> {
            // Create two legacy profiles with identical CCCD in verificationPayload
            AppUser legacyUser1 = createTestUser("legacy1@test.com", "Legacy User 1");
            TeacherProfile legacyProfile1 = createTestProfile(legacyUser1);

            KycRequest req1 = new KycRequest();
            req1.setTeacherProfile(legacyProfile1);
            req1.setStatus(KycRequestStatus.DRAFT);
            req1.setIdentityStatus(IdentityVerificationStatus.VERIFIED);
            req1.setVerificationPayload(Map.of("identityOcr", Map.of("idNumber", "888777666555")));
            kycRequestRepository.save(req1);

            AppUser legacyUser2 = createTestUser("legacy2@test.com", "Legacy User 2");
            TeacherProfile legacyProfile2 = createTestProfile(legacyUser2);

            KycRequest req2 = new KycRequest();
            req2.setTeacherProfile(legacyProfile2);
            req2.setStatus(KycRequestStatus.DRAFT);
            req2.setIdentityStatus(IdentityVerificationStatus.VERIFIED);
            req2.setVerificationPayload(Map.of("identityOcr", Map.of("idNumber", "888 777 666 555")));
            kycRequestRepository.save(req2);

            // Execute backfill
            backfillRunner.backfillExistingIdentityClaims();

            String fingerprint = claimService.generateFingerprint("888777666555");
            // Fail closed: Neither profile is automatically claimed
            assertTrue(claimRepository.findByIdentityFingerprint(fingerprint).isEmpty());
            assertTrue(claimRepository.findByTeacherId(legacyProfile1.getId()).isEmpty());
            assertTrue(claimRepository.findByTeacherId(legacyProfile2.getId()).isEmpty());

            // Quarantine audit log created for both
            List<AuditLog> quarantineAudits = auditLogRepository.findAll().stream()
                    .filter(a -> "KYC_BACKFILL_DUPLICATE_QUARANTINED".equals(a.getAction()))
                    .toList();
            assertFalse(quarantineAudits.isEmpty(), "Quarantine security audit log must be recorded for historical duplicates");

            status.setRollbackOnly();
        });
    }

    @Test
    void testTeacherKycStatusResponseSanitizesPii() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        tx.executeWithoutResult(status -> {
            AppUser user = createTestUser("pii@test.com", "Nguyen Van A");
            TeacherProfile profile = createTestProfile(user);

            KycIdentityVerificationRequest req = createMockSdkRequest("012345678901", "Nguyen Van A");
            teacherKycService.verifyIdentity(user.getId(), req, "127.0.0.1", "TestAgent");

            KycStatusResponse statusResp = teacherKycService.getStatus(user.getId());
            assertNotNull(statusResp);
            assertNotNull(statusResp.latestRequest());

            Map<String, Object> payload = statusResp.latestRequest().verificationPayload();
            // Assert providerResult removed
            assertFalse(payload.containsKey("providerResult"), "Teacher response must NOT contain providerResult");

            // Assert idNumber redacted
            @SuppressWarnings("unchecked")
            Map<String, Object> ocr = (Map<String, Object>) payload.get("identityOcr");
            assertNotNull(ocr);
            String idNum = String.valueOf(ocr.get("idNumber"));
            assertFalse(idNum.contains("012345678901"), "Teacher response must NOT contain raw CCCD");
            assertTrue(idNum.contains("*"), "idNumber must be masked in teacher response");

            status.setRollbackOnly();
        });
    }
}
