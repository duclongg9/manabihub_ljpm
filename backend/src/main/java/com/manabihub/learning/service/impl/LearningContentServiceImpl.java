package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.internal.QuizItemJsonDto;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.finaltest.entity.FinalTest;
import com.manabihub.finaltest.repository.FinalTestRepository;
import com.manabihub.learning.dto.response.FinalTestEligibilityResponse;
import com.manabihub.learning.dto.response.PublicFinalTestDto;
import com.manabihub.learning.dto.response.PublicQuizItemDto;
import com.manabihub.learning.service.LearningContentService;
import com.manabihub.learning.service.LearningFinalTestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningContentServiceImpl implements LearningContentService {

    private final LessonBlockRepository lessonBlockRepository;
    private final FinalTestRepository finalTestRepository;
    private final LearningFinalTestService learningFinalTestService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PublicQuizItemDto> getQuizContent(UUID courseId, UUID blockId) {
        // Find lesson block
        LessonBlock block = lessonBlockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Block not found"));
        
        if (!block.getModule().getCourse().getId().equals(courseId)) {
            throw new BusinessException("BAD_REQUEST", "Block does not belong to the specified course");
        }

        String json = block.getQuizItemsJson();
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            List<QuizItemJsonDto> internalItems = objectMapper.readValue(json, new TypeReference<>() {});
            return internalItems.stream().map(item -> PublicQuizItemDto.builder()
                    .id(item.getId())
                    .content(item.getContent())
                    .required(item.isRequired())
                    .options(item.getOptions().stream().map(opt -> PublicQuizItemDto.OptionDto.builder()
                            .id(opt.getId())
                            .content(opt.getContent())
                            .build()).collect(Collectors.toList()))
                    .build()).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to parse quiz items JSON", e);
            throw new BusinessException("INTERNAL_ERROR", "Failed to parse quiz content");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PublicFinalTestDto getFinalTestContent(UUID courseId) {
        // Check eligibility first
        FinalTestEligibilityResponse eligibility = learningFinalTestService.checkEligibility(courseId);
        if (!eligibility.isEligible()) {
            throw new BusinessException("FORBIDDEN", "You are not eligible to take the final test. Reason: " + eligibility.getReason());
        }

        FinalTest finalTest = finalTestRepository.findByCourseId(courseId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Final test not found for this course"));

        return PublicFinalTestDto.builder()
                .id(finalTest.getId())
                .timeLimitMinutes(finalTest.getTimeLimitMinutes())
                .questions(finalTest.getQuestions().stream().map(q -> PublicFinalTestDto.PublicFinalTestQuestionDto.builder()
                        .id(q.getId())
                        .content(q.getContent())
                        .choices(q.getChoices().stream().map(c -> PublicFinalTestDto.PublicFinalTestChoiceDto.builder()
                                .id(c.getId())
                                .content(c.getContent())
                                .build()).collect(Collectors.toList()))
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
