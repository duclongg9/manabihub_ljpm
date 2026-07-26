package com.manabihub.kyc.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.*;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.dto.response.KycRequestResponse;
import com.manabihub.kyc.repository.*;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.identity.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycServiceImplTest {

    @Mock
    private KycRequestRepository kycRequestRepository;

    @Mock
    private InternalAdminAccountRepository adminAccountRepository;

    @Mock
    private TeacherProfileRepository teacherProfileRepository;

    @Mock
    private KycDocumentRepository kycDocumentRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private jakarta.persistence.EntityManager entityManager;

    @Mock
    private jakarta.persistence.Query nativeQuery;

    @InjectMocks
    private KycServiceImpl kycService;

    private InternalAdminAccount courseManager;
    private AppUser teacherUser;
    private TeacherProfile teacherProfile;
    private KycRequest pendingKycRequest;
    private UUID kycId;

    @BeforeEach
    void setUp() {
        kycId = UUID.randomUUID();

        courseManager = new InternalAdminAccount();
        courseManager.setId(UUID.randomUUID());
        courseManager.setEmail("manager@manabihub.local");
        courseManager.setAccountStatus("ACTIVE");

        teacherUser = new AppUser();
        teacherUser.setId(UUID.randomUUID());
        teacherUser.setEmail("teacher@manabihub.local");

        teacherProfile = new TeacherProfile();
        teacherProfile.setId(UUID.randomUUID());
        teacherProfile.setUser(teacherUser);
        teacherProfile.setKycStatus(TeacherKycStatus.PENDING);

        pendingKycRequest = new KycRequest();
        pendingKycRequest.setId(kycId);
        pendingKycRequest.setTeacherProfile(teacherProfile);
        pendingKycRequest.setStatus(KycRequestStatus.PENDING);
        pendingKycRequest.setCreatedAt(Instant.now());
        pendingKycRequest.setUpdatedAt(Instant.now());
    }

    @Test
    void testReviewKyc_WhenNotAuthorized_ShouldThrowException() {
        UUID randomAdminId = UUID.randomUUID();
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(any(UUID.class), anyList())).thenReturn(false);

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.APPROVED, "OK");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, randomAdminId, "SYSTEM_ADMIN", "admin@manabihub.local")
        );

        assertEquals("ADMIN_PERMISSION_DENIED", exception.getMessageCode());
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        verify(kycRequestRepository, never()).save(any());
    }

    @Test
    void testReviewKyc_WhenRejectWithoutNote_ShouldThrowException() {
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(eq(courseManager.getId()), anyList())).thenReturn(true);
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(pendingKycRequest));
        when(adminAccountRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.REJECTED, "   ");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, courseManager.getId(), "COURSE_MANAGER", "manager@manabihub.local")
        );

        assertEquals("VALIDATION_FAILED", exception.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(kycRequestRepository, never()).save(any());
    }

    @Test
    void testReviewKyc_WhenInvalidStatus_ShouldThrowException() {
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(eq(courseManager.getId()), anyList())).thenReturn(true);
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(pendingKycRequest));
        when(adminAccountRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.DRAFT, "Drafting");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, courseManager.getId(), "COURSE_MANAGER", "manager@manabihub.local")
        );

        assertEquals("VALIDATION_FAILED", exception.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(kycRequestRepository, never()).save(any());
    }

    @Test
    void testReviewKyc_WhenApprove_ShouldSaveAllEntitiesAndUpgradeStatus() throws Exception {
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(eq(courseManager.getId()), anyList())).thenReturn(true);
        when(adminAccountRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(pendingKycRequest));
        when(kycRequestRepository.save(any(KycRequest.class))).thenAnswer(i -> i.getArguments()[0]);
        when(kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(any())).thenReturn(List.of());

        // removed userRepository mocks

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.APPROVED, "Looks good");

        KycRequestResponse response = kycService.reviewKyc(kycId, request, courseManager.getId(), "COURSE_MANAGER", "manager@manabihub.local");

        assertNotNull(response);
        assertEquals(KycRequestStatus.APPROVED, response.getStatus());

        assertEquals(TeacherKycStatus.APPROVED, teacherProfile.getKycStatus());
        assertTrue(teacherProfile.isCanPublishCourse());
        verify(teacherProfileRepository).save(teacherProfile);
    }

    @Test
    void testReviewKyc_WhenRevokeApproved_ShouldRemoveTeacherRoleAndDowngrade() {
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(eq(courseManager.getId()), anyList())).thenReturn(true);
        when(adminAccountRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));

        teacherProfile.setKycStatus(TeacherKycStatus.APPROVED);
        teacherProfile.setCanPublishCourse(true);

        KycRequest approvedRequest = new KycRequest();
        approvedRequest.setId(kycId);
        approvedRequest.setTeacherProfile(teacherProfile);
        approvedRequest.setStatus(KycRequestStatus.APPROVED);
        approvedRequest.setCreatedAt(Instant.now());
        approvedRequest.setUpdatedAt(Instant.now());
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(approvedRequest));
        when(kycRequestRepository.save(any(KycRequest.class))).thenAnswer(i -> i.getArguments()[0]);
        when(kycDocumentRepository.findByKycRequestIdOrderByCreatedAtAsc(any())).thenReturn(List.of());
        when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
        when(nativeQuery.setParameter(anyString(), any())).thenReturn(nativeQuery);
        when(nativeQuery.executeUpdate()).thenReturn(1);

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.REVOKED, "Phát hiện gian lận sau tố cáo");

        KycRequestResponse response = kycService.reviewKyc(kycId, request, courseManager.getId(), "COURSE_MANAGER", "manager@manabihub.local");

        assertNotNull(response);
        assertEquals(KycRequestStatus.REVOKED, response.getStatus());
        assertEquals(TeacherKycStatus.REVOKED, teacherProfile.getKycStatus());
        assertFalse(teacherProfile.isCanPublishCourse());
        verify(teacherProfileRepository).save(teacherProfile);
        verify(entityManager).createNativeQuery(contains("DELETE FROM user_roles"));
        verify(nativeQuery).executeUpdate();
    }

    @Test
    void testReviewKyc_WhenRevokeWithoutNote_ShouldThrowValidation() {
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(eq(courseManager.getId()), anyList())).thenReturn(true);
        when(adminAccountRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));

        KycRequest approvedRequest = new KycRequest();
        approvedRequest.setId(kycId);
        approvedRequest.setTeacherProfile(teacherProfile);
        approvedRequest.setStatus(KycRequestStatus.APPROVED);
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(approvedRequest));

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.REVOKED, "  ");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, courseManager.getId(), "COURSE_MANAGER", "manager@manabihub.local")
        );

        assertEquals("VALIDATION_FAILED", exception.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(kycRequestRepository, never()).save(any());
    }

    @Test
    void testReviewKyc_WhenStatusNotPending_ShouldThrowConflict() {
        when(adminAccountRepository.existsByAdminIdAndRoleCodes(eq(courseManager.getId()), anyList())).thenReturn(true);

        KycRequest approvedRequest = new KycRequest();
        approvedRequest.setId(kycId);
        approvedRequest.setStatus(KycRequestStatus.APPROVED);
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(approvedRequest));

        KycReviewRequest request = new KycReviewRequest(KycRequestStatus.REJECTED, "Bad");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, courseManager.getId(), "COURSE_MANAGER", "manager@manabihub.local")
        );

        assertEquals("COMMON_CONFLICT", exception.getMessageCode());
    }
}
