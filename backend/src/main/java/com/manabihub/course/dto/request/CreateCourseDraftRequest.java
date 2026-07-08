package com.manabihub.course.dto.request;

import com.manabihub.course.enums.JlptLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
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
        List<@NotBlank @Size(max = 160) String> learningGoals
) {
}
