package com.manabihub.learning.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class FinalTestSubmitRequest {
    @NotNull(message = "Final Test ID is required")
    private String finalTestId;

    @NotNull(message = "Attempt ID is required")
    private String attemptId;

    @NotEmpty(message = "Answers cannot be empty")
    private List<FinalTestAnswerDto> answers;

    @Data
    public static class FinalTestAnswerDto {
        @NotNull(message = "Question ID is required")
        private String questionId;
        
        private List<String> selectedChoiceIds;
    }
}
