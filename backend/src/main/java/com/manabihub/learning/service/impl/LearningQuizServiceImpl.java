package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.internal.QuizItemJsonDto;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.request.QuizSubmitRequest;
import com.manabihub.learning.dto.response.QuizSubmitResponse;
import com.manabihub.learning.entity.QuizAttempt;
import com.manabihub.learning.repository.LearningEnrollmentRepository;
import com.manabihub.learning.repository.QuizAttemptRepository;
import com.manabihub.learning.service.LearningQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningQuizServiceImpl implements LearningQuizService {

    private final LessonBlockRepository lessonBlockRepository;
    private final LearningEnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public QuizSubmitResponse submitQuiz(UUID courseId, UUID blockId, QuizSubmitRequest request) {
        UUID userId = currentUserService.getCurrentUserId();

        // 1. Check Enrollment
        UUID enrollmentId = enrollmentRepository.findActiveEnrollmentId(userId, courseId)
                .orElseThrow(() -> new BusinessException("NOT_ENROLLED", "You must be enrolled in the course to submit quizzes."));

        // 2. Fetch LessonBlock
        LessonBlock block = lessonBlockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "LessonBlock not found"));

        if (!"QUIZ".equalsIgnoreCase(block.getType().name())) {
            throw new BusinessException("INVALID_BLOCK_TYPE", "This block is not a quiz.");
        }

        // 3. Parse Quiz Items from JSON
        List<QuizItemJsonDto> quizItems;
        try {
            if (block.getQuizItemsJson() == null || block.getQuizItemsJson().isEmpty()) {
                throw new BusinessException("QUIZ_EMPTY", "This quiz has no questions.");
            }
            quizItems = objectMapper.readValue(block.getQuizItemsJson(), new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to parse quiz items for block {}", blockId, e);
            throw new BusinessException("INTERNAL_ERROR", "Failed to parse quiz items.");
        }

        Map<String, QuizItemJsonDto> questionMap = quizItems.stream()
                .collect(Collectors.toMap(QuizItemJsonDto::getId, Function.identity()));

        // 4. Validate and Score
        Map<String, List<String>> userAnswers = request.getAnswers().stream()
                .collect(Collectors.toMap(QuizSubmitRequest.QuizAnswerDto::getQuestionId, QuizSubmitRequest.QuizAnswerDto::getSelectedOptions));

        List<QuizSubmitResponse.QuizFeedbackDto> feedbacks = new ArrayList<>();
        int totalQuestions = quizItems.size();
        int correctCount = 0;

        for (QuizItemJsonDto item : quizItems) {
            List<String> selected = userAnswers.getOrDefault(item.getId(), List.of());
            
            if (item.isRequired() && selected.isEmpty()) {
                throw new BusinessException("MISSING_REQUIRED_ANSWER", "Please answer all required questions.");
            }

            List<String> correctOptions = item.getOptions() == null ? List.of() : item.getOptions().stream()
                    .filter(QuizItemJsonDto.Option::isCorrect)
                    .map(QuizItemJsonDto.Option::getId)
                    .toList();

            boolean isCorrect = selected.size() == correctOptions.size() && selected.containsAll(correctOptions);

            if (isCorrect) {
                correctCount++;
            }

            feedbacks.add(QuizSubmitResponse.QuizFeedbackDto.builder()
                    .questionId(item.getId())
                    .isCorrect(isCorrect)
                    .explanation(item.getExplanation())
                    .correctOptions(correctOptions)
                    .build());
        }

        BigDecimal score = BigDecimal.valueOf((double) correctCount / totalQuestions * 100).setScale(2, RoundingMode.HALF_UP);
        boolean passed = score.compareTo(BigDecimal.valueOf(80)) >= 0;

        // 5. Store Attempt
        try {
            String answersJsonToSave = objectMapper.writeValueAsString(request.getAnswers());
            QuizAttempt attempt = QuizAttempt.builder()
                    .enrollmentId(enrollmentId)
                    .lessonBlock(block)
                    .score(score)
                    .passed(passed)
                    .answersJson(answersJsonToSave)
                    .build();
            quizAttemptRepository.save(attempt);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize user answers", e);
        }

        return QuizSubmitResponse.builder()
                .score(score)
                .passed(passed)
                .feedbacks(feedbacks)
                .build();
    }
}
