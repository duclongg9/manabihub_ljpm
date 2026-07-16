package com.manabihub.learning.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class FinalTestSubmitResponse {
    private BigDecimal score;
    private boolean passed;
    private List<FinalTestFeedbackDto> feedbacks;

    @Data
    @Builder
    public static class FinalTestFeedbackDto {
        private String questionId;
        private boolean isCorrect;
        private String explanation;
        private List<String> correctChoiceIds;
    }
}
