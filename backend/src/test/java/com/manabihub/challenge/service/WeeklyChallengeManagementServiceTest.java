package com.manabihub.challenge.service;

import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.challenge.entity.WeeklyLearningChallenge;
import com.manabihub.challenge.enums.ChallengeStatus;
import com.manabihub.challenge.repository.DailyLearningAttendanceRewardRepository;
import com.manabihub.challenge.repository.WeeklyLearningChallengeAttemptRepository;
import com.manabihub.challenge.repository.WeeklyLearningChallengePairRepository;
import com.manabihub.challenge.repository.WeeklyLearningChallengeRepository;
import com.manabihub.challenge.repository.WeeklyLearningChallengeRewardRepository;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeeklyChallengeManagementServiceTest {
    @Mock private WeeklyLearningChallengeRepository challengeRepository;
    @Mock private WeeklyLearningChallengePairRepository pairRepository;
    @Mock private WeeklyLearningChallengeAttemptRepository attemptRepository;
    @Mock private WeeklyLearningChallengeRewardRepository rewardRepository;
    @Mock private DailyLearningAttendanceRewardRepository attendanceRewardRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private AuditLogRepository auditLogRepository;

    private WeeklyChallengeManagementService service;
    private UUID managerId;

    @BeforeEach
    void setUp() {
        service = new WeeklyChallengeManagementService(challengeRepository, pairRepository,
                attemptRepository, rewardRepository, attendanceRewardRepository,
                courseRepository, auditLogRepository);
        managerId = UUID.randomUUID();
        when(courseRepository.hasAdminRole(managerId, List.of("COURSE_MANAGER"))).thenReturn(true);
    }

    @Test
    void unpublish_isBlockedAfterDailyAttendanceMoneyWasAwarded() {
        UUID challengeId = UUID.randomUUID();
        WeeklyLearningChallenge challenge = challenge(challengeId, ChallengeStatus.PUBLISHED);
        when(challengeRepository.findByIdForUpdate(challengeId)).thenReturn(Optional.of(challenge));
        when(attemptRepository.existsByChallengeId(challengeId)).thenReturn(false);
        when(rewardRepository.existsByChallengeId(challengeId)).thenReturn(false);
        when(attendanceRewardRepository.existsByChallengeId(challengeId)).thenReturn(true);

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.unpublish(managerId, challengeId));

        assertEquals("WEEKLY_CHALLENGE_INVALID", error.getMessageCode());
        assertEquals(ChallengeStatus.PUBLISHED, challenge.getStatus());
        verifyNoInteractions(auditLogRepository);
    }

    @Test
    void delete_isBlockedForDraftWithRecordedRewardHistory() {
        UUID challengeId = UUID.randomUUID();
        WeeklyLearningChallenge challenge = challenge(challengeId, ChallengeStatus.DRAFT);
        when(challengeRepository.findByIdForUpdate(challengeId)).thenReturn(Optional.of(challenge));
        when(attemptRepository.existsByChallengeId(challengeId)).thenReturn(false);
        when(rewardRepository.existsByChallengeId(challengeId)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.delete(managerId, challengeId));

        verify(challengeRepository, never()).delete(any());
        verifyNoInteractions(auditLogRepository);
    }

    private WeeklyLearningChallenge challenge(UUID id, ChallengeStatus status) {
        return WeeklyLearningChallenge.builder()
                .id(id)
                .weekStart(LocalDate.of(2026, 8, 10))
                .status(status)
                .build();
    }
}
