package com.manabihub.identity.service;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.dto.request.StudentIdentityVerificationRequest;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.impl.StudentIdentityVerificationServiceImpl;
import com.manabihub.kyc.port.NationalIdRecordDto;
import com.manabihub.kyc.port.NationalIdRegistryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentIdentityVerificationServiceTest {

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private NationalIdRegistryPort nationalIdRegistry;

    @InjectMocks
    private StudentIdentityVerificationServiceImpl service;

    private StudentProfile student;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "identitySecret", "student-identity-test-secret-32-bytes");
        student = new StudentProfile();
        student.setId(UUID.randomUUID());
        when(currentUserService.getCurrentUserId()).thenReturn(UUID.randomUUID());
        when(studentProfileRepository.findByUser_Id(any())).thenReturn(Optional.of(student));
    }

    @Test
    void verify_matchesNestedVnptPayloadAgainstSyntheticRegistry() {
        when(nationalIdRegistry.findActiveByIdNumber("027204002711"))
                .thenReturn(Optional.of(new NationalIdRecordDto(
                        "027204002711", "NGUYEN XUAN DAT", LocalDate.of(2004, 8, 31))));
        when(studentProfileRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        StudentIdentityVerificationRequest request = new StudentIdentityVerificationRequest(
                "session-1",
                "tx-1",
                Map.of("result", Map.of(
                        "idNumber", "027 204 002 711",
                        "fullName", "Nguyễn Xuân Đạt",
                        "dateOfBirth", "31/08/2004"),
                "liveness_face", Map.of("liveness", "success"),
                "compare", Map.of("result", "match", "prob", 0.98D),
                "masked", Map.of("masked", "false")));

        var response = service.verify(request);

        assertEquals("VERIFIED", response.status());
        assertEquals("NGUYEN XUAN DAT", response.fullName());
        assertNotNull(student.getIdentityFingerprint());
        assertNotNull(student.getIdentityVerifiedAt());
    }

    @Test
    void verify_rejectsPayloadThatDoesNotMatchSyntheticRegistry() {
        StudentIdentityVerificationRequest request = new StudentIdentityVerificationRequest(
                null,
                null,
                Map.of("idNumber", "027204002711", "fullName", "SOMEONE ELSE", "dob", "2004-08-31"));

        BusinessException error = assertThrows(BusinessException.class, () -> service.verify(request));

        assertEquals("MSG-KYC-002", error.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, error.getHttpStatus());
    }
}
