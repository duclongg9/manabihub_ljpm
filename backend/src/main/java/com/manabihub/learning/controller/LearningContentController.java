package com.manabihub.learning.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.learning.dto.response.PublicFinalTestDto;
import com.manabihub.learning.dto.response.PublicQuizItemDto;
import com.manabihub.learning.service.LearningContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
public class LearningContentController {

    private final LearningContentService learningContentService;

    @GetMapping("/courses/{courseId}/blocks/{blockId}/quiz")
    public ApiResponse<List<PublicQuizItemDto>> getQuizContent(
            @PathVariable UUID courseId,
            @PathVariable UUID blockId) {
        List<PublicQuizItemDto> data = learningContentService.getQuizContent(courseId, blockId);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", data);
    }

    @GetMapping("/courses/{courseId}/final-test")
    public ApiResponse<PublicFinalTestDto> getFinalTestContent(@PathVariable UUID courseId) {
        PublicFinalTestDto data = learningContentService.getFinalTestContent(courseId);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", data);
    }
}
