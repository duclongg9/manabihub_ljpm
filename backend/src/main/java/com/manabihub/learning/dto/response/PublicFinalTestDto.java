package com.manabihub.learning.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PublicFinalTestDto {
    private UUID id;
    private Integer timeLimitMinutes;
    private List<PublicFinalTestQuestionDto> questions;

    @Data
    @Builder
    public static class PublicFinalTestQuestionDto {
        private UUID id;
        private String content;
        private List<PublicFinalTestChoiceDto> choices;
    }

    @Data
    @Builder
    public static class PublicFinalTestChoiceDto {
        private UUID id;
        private String content;
    }
}
