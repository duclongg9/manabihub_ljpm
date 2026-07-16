package com.manabihub.learning.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PublicQuizItemDto {
    private String id;
    private String content;
    private boolean required;
    private List<OptionDto> options;

    @Data
    @Builder
    public static class OptionDto {
        private String id;
        private String content;
    }
}
