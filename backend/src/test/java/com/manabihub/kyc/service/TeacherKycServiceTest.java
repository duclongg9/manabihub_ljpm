package com.manabihub.kyc.service;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.port.JlptRegistryPort;
import com.manabihub.kyc.port.NationalIdRegistryPort;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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
    private NationalIdRegistryPort nationalIdRegistryPort;
    @Mock
    private JlptRegistryPort jlptRegistryPort;
    @Mock
    private TeacherIdentityClaimService teacherIdentityClaimService;
    @Mock
    private EntityManager entityManager;

    private TeacherKycService teacherKycService;

    @BeforeEach
    void setUp() {
        teacherKycService = new TeacherKycService(
                teacherProfileRepository,
                kycRequestRepository,
                kycDocumentRepository,
                auditLogRepository,
                nationalIdRegistryPort,
                jlptRegistryPort,
                teacherIdentityClaimService,
                entityManager,
                "storage/kyc"
        );
    }

    @Test
    void getStatus_Success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();

        AppUser mockUser = new AppUser();
        mockUser.setId(userId);

        TeacherProfile mockProfile = new TeacherProfile();
        mockProfile.setId(teacherId);
        mockProfile.setUser(mockUser);
        mockProfile.setKycStatus(TeacherKycStatus.APPROVED);
        mockProfile.setCanPublishCourse(true);

        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(mockProfile));
        when(kycRequestRepository.findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherId)).thenReturn(Optional.empty());

        // Act
        KycStatusResponse response = teacherKycService.getStatus(userId);

        // Assert
        assertNotNull(response);
        assertEquals(teacherId, response.teacherId());
        assertEquals("APPROVED", response.teacherKycStatus());
        assertTrue(response.canPublishCourse());

        verify(teacherProfileRepository).findByUserId(userId);
        verify(kycRequestRepository).findTopByTeacherProfileIdOrderBySubmittedAtDesc(teacherId);
    }

    @Test
    void getStatus_ThrowsNotFound_WhenTeacherProfileDoesNotExist() {
        // Arrange
        UUID userId = UUID.randomUUID();
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> teacherKycService.getStatus(userId));
        assertEquals("Teacher profile was not found for the current user", exception.getMessage());
    }
}
