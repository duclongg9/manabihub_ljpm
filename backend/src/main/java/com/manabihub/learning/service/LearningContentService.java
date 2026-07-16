package com.manabihub.learning.service;

import com.manabihub.learning.dto.response.PublicFinalTestDto;
import com.manabihub.learning.dto.response.PublicQuizItemDto;

import java.util.List;
import java.util.UUID;

public interface LearningContentService {
    List<PublicQuizItemDto> getQuizContent(UUID courseId, UUID blockId);
    PublicFinalTestDto getFinalTestContent(UUID courseId);
}
