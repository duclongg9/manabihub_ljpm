package com.manabihub.learning.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class QuizSubmitRequest {
    @NotEmpty(message = "Answers cannot be empty")
    private List<QuizAnswerDto> answers;

    @Data
    public static class QuizAnswerDto {
        @NotNull(message = "Question ID is required")
        private String questionId;
        
        private List<String> selectedOptions;
    }
}
