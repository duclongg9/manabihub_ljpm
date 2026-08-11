package com.manabihub.course.dto.request;

import com.manabihub.course.enums.JlptLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CreateCourseDraftRequest(
        @Size(max = 255)
        String title,

        @NotBlank
        @Size(max = 4000)
        String introduction,

        @NotNull
        JlptLevel jlptLevel,

        @NotBlank
        @Size(max = 100)
        String category,

        @Size(max = 2048)
        String thumbnailUrl,

        @NotBlank
        @Size(max = 4000)
        String outcomes,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal price,

        @NotBlank
        @Size(max = 2000)
        String prerequisites,

        @NotBlank
        @Size(max = 2000)
        String targetStudents,

        @NotNull
        @Size(min = 4)
        List<@NotBlank @Size(max = 160) String> learningGoals,

        /** Optional access policy; null keeps the platform default of 180 days. */
        Integer accessDurationDays,

        /** Optional fixed expiry for exam-cohort courses. */
        Instant accessExpiresAt
) {
    public CreateCourseDraftRequest(
            String title,
            String introduction,
            JlptLevel jlptLevel,
            String category,
            String thumbnailUrl,
            String outcomes,
            BigDecimal price,
            String prerequisites,
            String targetStudents,
            List<String> learningGoals
    ) {
        this(title, introduction, jlptLevel, category, thumbnailUrl, outcomes, price,
                prerequisites, targetStudents, learningGoals, null, null);
    }
}
