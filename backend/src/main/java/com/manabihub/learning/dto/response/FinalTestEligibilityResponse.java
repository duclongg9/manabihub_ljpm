package com.manabihub.learning.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FinalTestEligibilityResponse {
    private boolean eligible;
    private String reason;
    private int totalLessons;
    private int completedLessons;
    private int attemptsLeft;
    private String finalTestId;
}
