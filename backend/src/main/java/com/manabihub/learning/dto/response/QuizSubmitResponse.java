package com.manabihub.learning.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class QuizSubmitResponse {
    private BigDecimal score;
    private boolean passed;
    private List<QuizFeedbackDto> feedbacks;

    @Data
    @Builder
    public static class QuizFeedbackDto {
        private String questionId;
        private boolean isCorrect;
        private String explanation;
        private List<String> correctOptions;
    }
}
