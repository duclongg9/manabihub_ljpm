package com.manabihub.learning.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.finaltest.entity.FinalTest;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.response.FinalTestEligibilityResponse;
import com.manabihub.learning.entity.FinalTestAttempt;
import com.manabihub.learning.repository.FinalTestAttemptRepository;
import com.manabihub.learning.repository.LearningEnrollmentRepository;
import com.manabihub.learning.service.impl.LearningFinalTestServiceImpl;
import com.manabihub.finaltest.repository.FinalTestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LearningFinalTestServiceImplTest {

    @Mock
    private FinalTestRepository finalTestRepository;
    @Mock
    private FinalTestAttemptRepository attemptRepository;
    @Mock
    private LearningEnrollmentRepository enrollmentRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private LearningFinalTestServiceImpl finalTestService;

    private UUID userId;
    private UUID courseId;
    private UUID enrollmentId;
    private FinalTest finalTest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        courseId = UUID.randomUUID();
        enrollmentId = UUID.randomUUID();
        
        com.manabihub.course.entity.Course course = new com.manabihub.course.entity.Course();
        course.setId(courseId);

        finalTest = FinalTest.builder()
                .id(UUID.randomUUID())
                .course(course)
                .maxRetakes(3)
                .timeLimitMinutes(60)
                .build();
    }

    @Test
    void testCheckEligibility_Success() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(enrollmentRepository.findActiveEnrollmentId(userId, courseId)).thenReturn(Optional.of(enrollmentId));
        when(finalTestRepository.findByCourseId(courseId)).thenReturn(Optional.of(finalTest));
        when(enrollmentRepository.countTotalLessons(courseId)).thenReturn(10);
        when(enrollmentRepository.countCompletedLessons(courseId, enrollmentId)).thenReturn(10);
        when(attemptRepository.findByEnrollmentIdAndFinalTestId(enrollmentId, finalTest.getId())).thenReturn(List.of());

        FinalTestEligibilityResponse response = finalTestService.checkEligibility(courseId);

        assertTrue(response.isEligible());
        assertEquals(3, response.getAttemptsLeft());
        assertNull(response.getReason());
    }

    @Test
    void testCheckEligibility_Fail_LessonsNotCompleted() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(enrollmentRepository.findActiveEnrollmentId(userId, courseId)).thenReturn(Optional.of(enrollmentId));
        when(finalTestRepository.findByCourseId(courseId)).thenReturn(Optional.of(finalTest));
        when(enrollmentRepository.countTotalLessons(courseId)).thenReturn(10);
        when(enrollmentRepository.countCompletedLessons(courseId, enrollmentId)).thenReturn(8);
        when(attemptRepository.findByEnrollmentIdAndFinalTestId(enrollmentId, finalTest.getId())).thenReturn(List.of());

        FinalTestEligibilityResponse response = finalTestService.checkEligibility(courseId);

        assertFalse(response.isEligible());
        assertEquals("LESSONS_NOT_COMPLETED", response.getReason());
    }

    @Test
    void testCertificateEligibility_BlocksOnFail() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(enrollmentRepository.findActiveEnrollmentId(userId, courseId)).thenReturn(Optional.of(enrollmentId));
        
        // Return false when checking if exists a passed attempt
        when(attemptRepository.existsByEnrollmentIdAndPassedTrue(enrollmentId)).thenReturn(false);

        boolean isEligible = finalTestService.isEligibleForCertificate(courseId);
        
        // Must block certificate if no passed attempts
        assertFalse(isEligible);
    }
    
    @Test
    void testCertificateEligibility_PassesIfSuccessfulAttemptExists() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(enrollmentRepository.findActiveEnrollmentId(userId, courseId)).thenReturn(Optional.of(enrollmentId));
        
        // Return true when checking if exists a passed attempt
        when(attemptRepository.existsByEnrollmentIdAndPassedTrue(enrollmentId)).thenReturn(true);

        boolean isEligible = finalTestService.isEligibleForCertificate(courseId);
        
        assertTrue(isEligible);
    }
}
