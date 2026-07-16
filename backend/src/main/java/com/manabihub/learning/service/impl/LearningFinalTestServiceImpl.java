package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.finaltest.entity.FinalTest;
import com.manabihub.finaltest.entity.FinalTestChoice;
import com.manabihub.finaltest.entity.FinalTestQuestion;
import com.manabihub.finaltest.repository.FinalTestRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.request.FinalTestSubmitRequest;
import com.manabihub.learning.dto.response.FinalTestEligibilityResponse;
import com.manabihub.learning.dto.response.FinalTestSubmitResponse;
import com.manabihub.learning.entity.FinalTestAttempt;
import com.manabihub.learning.repository.FinalTestAttemptRepository;
import com.manabihub.learning.repository.LearningEnrollmentRepository;
import com.manabihub.learning.service.LearningFinalTestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningFinalTestServiceImpl implements LearningFinalTestService {

    private final FinalTestRepository finalTestRepository;
    private final FinalTestAttemptRepository attemptRepository;
    private final LearningEnrollmentRepository enrollmentRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public FinalTestEligibilityResponse checkEligibility(UUID courseId) {
        UUID userId = currentUserService.getCurrentUserId();
        
        UUID enrollmentId = enrollmentRepository.findActiveEnrollmentId(userId, courseId)
                .orElseThrow(() -> new BusinessException("NOT_ENROLLED", "You are not enrolled in this course."));

        FinalTest finalTest = finalTestRepository.findByCourseId(courseId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Final test not found for course"));

        int totalLessons = enrollmentRepository.countTotalLessons(courseId);
        int completedLessons = enrollmentRepository.countCompletedLessons(courseId, enrollmentId);
        
        boolean isEligible = totalLessons > 0 && completedLessons == totalLessons;

        List<FinalTestAttempt> previousAttempts = attemptRepository.findByEnrollmentIdAndFinalTestId(enrollmentId, finalTest.getId());
        int attemptsLeft = finalTest.getMaxRetakes() - previousAttempts.size();
        
        if (isEligible && attemptsLeft <= 0) {
            isEligible = false;
        }

        return FinalTestEligibilityResponse.builder()
                .eligible(isEligible)
                .reason(isEligible ? null : (attemptsLeft <= 0 ? "MAX_RETAKES_REACHED" : "LESSONS_NOT_COMPLETED"))
                .totalLessons(totalLessons)
                .completedLessons(completedLessons)
                .attemptsLeft(Math.max(0, attemptsLeft))
                .finalTestId(finalTest.getId().toString())
                .build();
    }

    @Override
    @Transactional
    public UUID startFinalTestAttempt(UUID courseId) {
        FinalTestEligibilityResponse eligibility = checkEligibility(courseId);
        if (!eligibility.isEligible()) {
            throw new BusinessException("NOT_ELIGIBLE", "You are not eligible to start this final test: " + eligibility.getReason());
        }

        UUID userId = currentUserService.getCurrentUserId();
        UUID enrollmentId = enrollmentRepository.findActiveEnrollmentId(userId, courseId).orElseThrow();

        FinalTest finalTest = finalTestRepository.findById(UUID.fromString(eligibility.getFinalTestId()))
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Final test not found"));

        FinalTestAttempt attempt = FinalTestAttempt.builder()
                .enrollmentId(enrollmentId)
                .finalTest(finalTest)
                .status(com.manabihub.learning.entity.FinalTestAttemptStatus.IN_PROGRESS)
                .build();
        
        attempt = attemptRepository.save(attempt);
        return attempt.getId();
    }

    @Override
    @Transactional
    public FinalTestSubmitResponse submitFinalTest(UUID courseId, FinalTestSubmitRequest request) {
        UUID userId = currentUserService.getCurrentUserId();
        UUID enrollmentId = enrollmentRepository.findActiveEnrollmentId(userId, courseId)
                .orElseThrow(() -> new BusinessException("NOT_ENROLLED", "Not enrolled in this course"));

        FinalTestAttempt attempt = attemptRepository.findById(UUID.fromString(request.getAttemptId()))
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Attempt not found"));

        if (!attempt.getEnrollmentId().equals(enrollmentId)) {
            throw new BusinessException("FORBIDDEN", "Attempt does not belong to your enrollment");
        }

        if (attempt.getStatus() != com.manabihub.learning.entity.FinalTestAttemptStatus.IN_PROGRESS) {
            throw new BusinessException("BAD_REQUEST", "Attempt is already submitted or timeout");
        }

        FinalTest finalTest = attempt.getFinalTest();
        
        // Timeout check: allow 2 extra minutes for network latency
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now();
        long minutesPassed = java.time.Duration.between(attempt.getStartTime(), now).toMinutes();
        if (minutesPassed > finalTest.getTimeLimitMinutes() + 2) {
            attempt.setStatus(com.manabihub.learning.entity.FinalTestAttemptStatus.TIMEOUT);
            attempt.setSubmitTime(now);
            attemptRepository.save(attempt);
            throw new BusinessException("TIMEOUT", "Time limit exceeded");
        }

        Map<String, List<String>> userAnswers = request.getAnswers().stream()
                .collect(Collectors.toMap(FinalTestSubmitRequest.FinalTestAnswerDto::getQuestionId, FinalTestSubmitRequest.FinalTestAnswerDto::getSelectedChoiceIds));

        int correctCount = 0;
        int totalQuestions = finalTest.getQuestions().size();
        List<FinalTestSubmitResponse.FinalTestFeedbackDto> feedbacks = new ArrayList<>();

        for (FinalTestQuestion question : finalTest.getQuestions()) {
            List<String> selectedChoices = userAnswers.getOrDefault(question.getId().toString(), List.of());
            List<String> correctChoices = question.getChoices().stream()
                    .filter(FinalTestChoice::getIsCorrect)
                    .map(c -> c.getId().toString())
                    .toList();

            boolean isCorrect = selectedChoices.size() == correctChoices.size() && selectedChoices.containsAll(correctChoices);
            if (isCorrect) correctCount++;

            feedbacks.add(FinalTestSubmitResponse.FinalTestFeedbackDto.builder()
                    .questionId(question.getId().toString())
                    .isCorrect(isCorrect)
                    .explanation(question.getExplanation())
                    .correctChoiceIds(correctChoices)
                    .build());
        }

        BigDecimal score = BigDecimal.valueOf((double) correctCount / totalQuestions * 100).setScale(2, RoundingMode.HALF_UP);
        boolean passed = score.compareTo(BigDecimal.valueOf(finalTest.getPassingScore())) >= 0;

        try {
            String answersJsonToSave = objectMapper.writeValueAsString(request.getAnswers());
            attempt.setAnswersJson(answersJsonToSave);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize final test answers", e);
        }

        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setStatus(com.manabihub.learning.entity.FinalTestAttemptStatus.SUBMITTED);
        attempt.setSubmitTime(now);
        attemptRepository.save(attempt);

        return FinalTestSubmitResponse.builder()
                .score(score)
                .passed(passed)
                .feedbacks(feedbacks)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEligibleForCertificate(UUID courseId) {
        UUID userId = currentUserService.getCurrentUserId();
        return enrollmentRepository.findActiveEnrollmentId(userId, courseId)
                .map(attemptRepository::existsByEnrollmentIdAndPassedTrue)
                .orElse(false);
    }
}
