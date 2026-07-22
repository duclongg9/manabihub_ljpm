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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class TeacherIdentityClaimDuplicatePostgresIntegrationTest {

    private static PostgreSQLContainer<?> postgresContainer;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (DockerClientFactory.instance().isDockerAvailable()) {
            postgresContainer = new PostgreSQLContainer<>("postgres:17-alpine");
            postgresContainer.start();
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
            registry.add("spring.datasource.username", postgresContainer::getUsername);
            registry.add("spring.datasource.password", postgresContainer::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        } else {
            // Fallback to local PostgreSQL cluster when Docker Desktop is absent
            registry.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:5439/manabihub_test");
            registry.add("spring.datasource.username", () -> "postgres");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        }
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
    }

    private static final UUID TEACHER_ROLE_ID = UUID.fromString("a0000000-0000-0000-0000-000000000002");

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

    @BeforeEach
    void setUp() {
        doAnswer(invocation -> {
            String id = invocation.getArgument(0);
            return Optional.of(new NationalIdRecordDto(id, "Nguyen Van A", LocalDate.of(1990, 1, 1)));
        }).when(nationalIdRegistryPort).findActiveByIdNumber(anyString());
    }

    private AppUser createTestUser(String emailPrefix, String fullName) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(emailPrefix + "_" + UUID.randomUUID() + "@test.com");
        user.setFullName(fullName);
        user.setProvider("LOCAL");
        user.setUserStatus(UserStatus.ACTIVE);
        entityManager.persist(user);
        entityManager.flush();
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

    private void grantTeacherRole(UUID userId) {
        entityManager.createNativeQuery(
                "INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId) ON CONFLICT DO NOTHING"
        ).setParameter("userId", userId)
         .setParameter("roleId", TEACHER_ROLE_ID)
         .executeUpdate();
    }

    private long countTeacherRoles(UUID userId) {
        Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM user_roles WHERE user_id = :userId AND role_id = :roleId"
        ).setParameter("userId", userId)
         .setParameter("roleId", TEACHER_ROLE_ID)
         .getSingleResult();
        return count.longValue();
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

    private String generateUniqueCccdDigits() {
        long num = Math.abs(UUID.randomUUID().getLeastSignificantBits() % 1000000000L);
        return String.format("099%09d", num);
    }

    @Test
    void testEndToEndDuplicateProtectionAndAuditPersistence() {
        TransactionTemplate tx1 = new TransactionTemplate(transactionManager);
        tx1.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        String cccdNormalized = generateUniqueCccdDigits();
        String cccdRawWithSpaces = cccdNormalized.substring(0, 3) + " " + cccdNormalized.substring(3, 6) + " " + cccdNormalized.substring(6, 9) + " " + cccdNormalized.substring(9, 12);

        // 1. Create & commit Teacher A in a committed transaction so actor_user_id FK exists for audit logs
        UUID userAId = tx1.execute(status -> {
            AppUser userA = createTestUser("teacherA", "Nguyen Van A");
            TeacherProfile profileA = createTestProfile(userA);
            return userA.getId();
        });

        // 2. Teacher A registers identity with formatted CCCD
        tx1.executeWithoutResult(status -> {
            KycIdentityVerificationRequest reqA = createMockSdkRequest(cccdRawWithSpaces, "Nguyen Van A");
            KycIdentityVerificationResponse respA = teacherKycService.verifyIdentity(userAId, reqA, "127.0.0.1", "TestAgent");

            assertNotNull(respA);
            TeacherProfile profileA = teacherProfileRepository.findByUserId(userAId).orElseThrow();
            assertTrue(claimRepository.findByTeacherId(profileA.getId()).isPresent());
        });

        // Verify registry received clean 12-digit string
        verify(nationalIdRegistryPort).findActiveByIdNumber(cccdNormalized);

        // 3. Teacher A retries with same CCCD -> Idempotent success
        tx1.executeWithoutResult(status -> {
            KycIdentityVerificationRequest reqA = createMockSdkRequest(cccdNormalized, "Nguyen Van A");
            KycIdentityVerificationResponse retryRespA = teacherKycService.verifyIdentity(userAId, reqA, "127.0.0.1", "TestAgent");
            assertNotNull(retryRespA);
        });

        // 4. Create & commit Teacher B user in committed transaction so REQUIRES_NEW audit log can reference actor_user_id FK
        UUID userBId = tx1.execute(status -> {
            AppUser userB = createTestUser("teacherB", "Nguyen Van A");
            TeacherProfile profileB = createTestProfile(userB);
            return userB.getId();
        });

        // 5. Teacher B attempts to use Teacher A's CCCD in separate TX 2
        TransactionTemplate tx2 = new TransactionTemplate(transactionManager);
        tx2.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        UUID teacherBId = tx2.execute(status -> {
            TeacherProfile profileB = teacherProfileRepository.findByUserId(userBId).orElseThrow();

            KycIdentityVerificationRequest reqB = createMockSdkRequest(cccdNormalized, "Nguyen Van A");

            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> teacherKycService.verifyIdentity(userBId, reqB, "127.0.0.1", "TestAgent")
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

        // 6. Assert Security Audit Log committed & persisted in DB despite TX 2 rollback!
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
    void testConcurrentRace_TwoThreadsAttemptSameIdentity() throws Exception {
        TransactionTemplate tx1 = new TransactionTemplate(transactionManager);
        tx1.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        String cccdNormalized = generateUniqueCccdDigits();

        // 1. Create and commit Teacher A and Teacher B
        UUID userAId = tx1.execute(status -> {
            AppUser userA = createTestUser("raceA", "Nguyen Van A");
            createTestProfile(userA);
            return userA.getId();
        });

        UUID userBId = tx1.execute(status -> {
            AppUser userB = createTestUser("raceB", "Nguyen Van A");
            createTestProfile(userB);
            return userB.getId();
        });

        // 2. Setup 2 threads to race unblocked by a CountDownLatch
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicReference<Object> outcomeA = new AtomicReference<>();
        AtomicReference<Object> outcomeB = new AtomicReference<>();

        Future<?> f1 = executor.submit(() -> {
            try {
                startLatch.await();
                KycIdentityVerificationRequest req = createMockSdkRequest(cccdNormalized, "Nguyen Van A");
                KycIdentityVerificationResponse resp = teacherKycService.verifyIdentity(userAId, req, "127.0.0.1", "Thread-1");
                outcomeA.set(resp);
            } catch (Throwable t) {
                outcomeA.set(t);
            }
        });

        Future<?> f2 = executor.submit(() -> {
            try {
                startLatch.await();
                KycIdentityVerificationRequest req = createMockSdkRequest(cccdNormalized, "Nguyen Van A");
                KycIdentityVerificationResponse resp = teacherKycService.verifyIdentity(userBId, req, "127.0.0.1", "Thread-2");
                outcomeB.set(resp);
            } catch (Throwable t) {
                outcomeB.set(t);
            }
        });

        // Release both threads simultaneously
        startLatch.countDown();

        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // 3. Assert EXACTLY ONE thread succeeded and EXACTLY ONE thread failed with HTTP 409 Conflict / MSG-KYC-008
        boolean aSuccess = isVerificationSuccess(outcomeA.get());
        boolean bSuccess = isVerificationSuccess(outcomeB.get());

        if (!(aSuccess ^ bSuccess)) {
            fail("Concurrency race assertion failed! aSuccess=" + aSuccess + " [outcomeA=" + outcomeA.get() + "], bSuccess=" + bSuccess + " [outcomeB=" + outcomeB.get() + "]");
        }

        Throwable failure = (Throwable) (aSuccess ? outcomeB.get() : outcomeA.get());
        while (failure.getCause() != null && !(failure instanceof BusinessException)) {
            failure = failure.getCause();
        }

        assertTrue(failure instanceof BusinessException, "Losing thread must throw BusinessException");
        BusinessException busEx = (BusinessException) failure;
        assertEquals(MessageCodes.MSG_KYC_008, busEx.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, busEx.getHttpStatus());

        // 4. Assert database contains EXACTLY ONE claim row for this fingerprint
        String fingerprint = claimService.generateFingerprint(cccdNormalized);
        assertTrue(claimRepository.findByIdentityFingerprint(fingerprint).isPresent());
        assertEquals(1, claimRepository.findAll().stream().filter(c -> fingerprint.equals(c.getIdentityFingerprint())).count());

        // 5. Assert durable security audit log persisted for the losing attempt
        UUID losingUserId = aSuccess ? userBId : userAId;
        TeacherProfile losingProfile = teacherProfileRepository.findByUserId(losingUserId).orElseThrow();

        List<AuditLog> auditLogs = auditLogRepository.findAll();
        boolean auditFound = auditLogs.stream()
                .filter(a -> "KYC_DUPLICATE_IDENTITY_DETECTED".equals(a.getAction()))
                .anyMatch(a -> losingProfile.getId().equals(a.getTargetId()));

        assertTrue(auditFound, "Security audit log must be persisted for the losing thread in concurrency race");
    }

    private boolean isVerificationSuccess(Object outcome) {
        if (outcome instanceof KycIdentityVerificationResponse resp) {
            return resp.request() != null && "VERIFIED".equals(resp.request().identityStatus());
        }
        return false;
    }

    @Test
    void testDirectDatabaseUniqueConstraintViolationHandling() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        String cccd = generateUniqueCccdDigits();

        tx.executeWithoutResult(status -> {
            AppUser userA = createTestUser("user1", "User 1");
            TeacherProfile profileA = createTestProfile(userA);

            String fingerprint = claimService.generateFingerprint(cccd);

            TeacherIdentityClaim claim1 = TeacherIdentityClaim.builder()
                    .teacherId(profileA.getId())
                    .identityFingerprint(fingerprint)
                    .build();
            claimRepository.saveAndFlush(claim1);

            AppUser userB = createTestUser("user2", "User 2");
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
    void testHistoricalBackfillQuarantinesLegacyDuplicateCCCDsFailClosedAndRevokesTeacherRole() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        String cccd = generateUniqueCccdDigits();
        String cccdFormatted = cccd.substring(0, 3) + " " + cccd.substring(3, 6) + " " + cccd.substring(6, 9) + " " + cccd.substring(9, 12);

        tx.executeWithoutResult(status -> {
            // Create two legacy profiles with identical CCCD in verificationPayload and seed TEACHER database roles
            AppUser legacyUser1 = createTestUser("legacy1", "Legacy User 1");
            TeacherProfile legacyProfile1 = createTestProfile(legacyUser1);
            legacyProfile1.setKycStatus(TeacherKycStatus.PENDING);
            legacyProfile1.setCanPublishCourse(true);
            teacherProfileRepository.save(legacyProfile1);
            grantTeacherRole(legacyUser1.getId());
            assertEquals(1, countTeacherRoles(legacyUser1.getId()), "Teacher 1 must have TEACHER database role prior to backfill");

            KycRequest req1 = new KycRequest();
            req1.setTeacherProfile(legacyProfile1);
            req1.setStatus(KycRequestStatus.DRAFT);
            req1.setIdentityStatus(IdentityVerificationStatus.VERIFIED);
            req1.setVerificationPayload(Map.of("identityOcr", Map.of("idNumber", cccd)));
            kycRequestRepository.save(req1);

            AppUser legacyUser2 = createTestUser("legacy2", "Legacy User 2");
            TeacherProfile legacyProfile2 = createTestProfile(legacyUser2);
            legacyProfile2.setKycStatus(TeacherKycStatus.PENDING);
            legacyProfile2.setCanPublishCourse(true);
            teacherProfileRepository.save(legacyProfile2);
            grantTeacherRole(legacyUser2.getId());
            assertEquals(1, countTeacherRoles(legacyUser2.getId()), "Teacher 2 must have TEACHER database role prior to backfill");

            KycRequest req2 = new KycRequest();
            req2.setTeacherProfile(legacyProfile2);
            req2.setStatus(KycRequestStatus.DRAFT);
            req2.setIdentityStatus(IdentityVerificationStatus.VERIFIED);
            req2.setVerificationPayload(Map.of("identityOcr", Map.of("idNumber", cccdFormatted)));
            kycRequestRepository.save(req2);

            // Execute backfill
            backfillRunner.backfillExistingIdentityClaims();

            String fingerprint = claimService.generateFingerprint(cccd);
            // Fail closed: Neither profile is automatically claimed
            assertTrue(claimRepository.findByIdentityFingerprint(fingerprint).isEmpty());
            assertTrue(claimRepository.findByTeacherId(legacyProfile1.getId()).isEmpty());
            assertTrue(claimRepository.findByTeacherId(legacyProfile2.getId()).isEmpty());

            // Assert FAIL-CLOSED: Rights revoked (kycStatus set to REJECTED and canPublishCourse set to false)
            TeacherProfile updatedProfile1 = teacherProfileRepository.findById(legacyProfile1.getId()).orElseThrow();
            TeacherProfile updatedProfile2 = teacherProfileRepository.findById(legacyProfile2.getId()).orElseThrow();

            assertEquals(TeacherKycStatus.REJECTED, updatedProfile1.getKycStatus());
            assertFalse(updatedProfile1.isCanPublishCourse());

            assertEquals(TeacherKycStatus.REJECTED, updatedProfile2.getKycStatus());
            assertFalse(updatedProfile2.isCanPublishCourse());

            // Assert TEACHER database role revoked from user_roles table for both users!
            assertEquals(0, countTeacherRoles(legacyUser1.getId()), "TEACHER role must be revoked from user_roles during quarantine");
            assertEquals(0, countTeacherRoles(legacyUser2.getId()), "TEACHER role must be revoked from user_roles during quarantine");

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

        String cccd = generateUniqueCccdDigits();

        tx.executeWithoutResult(status -> {
            AppUser user = createTestUser("pii", "Nguyen Van A");
            TeacherProfile profile = createTestProfile(user);

            KycIdentityVerificationRequest req = createMockSdkRequest(cccd, "Nguyen Van A");
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
            assertFalse(idNum.contains(cccd), "Teacher response must NOT contain raw CCCD");
            assertTrue(idNum.contains("*"), "idNumber must be masked in teacher response");

            status.setRollbackOnly();
        });
    }
}
