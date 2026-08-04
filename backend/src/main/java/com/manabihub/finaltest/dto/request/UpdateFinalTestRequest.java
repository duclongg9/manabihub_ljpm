package com.manabihub.finaltest.dto.request;

import com.manabihub.course.enums.JlptLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFinalTestRequest {

    @NotNull(message = "MSG-FTEST-003")
    @Min(value = 1, message = "MSG-FTEST-003")
    private Integer timeLimitMinutes;

    @NotNull(message = "MSG-FTEST-003")
    @Min(value = 1, message = "MSG-FTEST-003")
    private Integer passingScore;

    @NotNull(message = "MSG-FTEST-003")
    @Min(value = 0, message = "MSG-FTEST-003")
    private Integer maxRetakes;

    @NotNull(message = "MSG-FTEST-003")
    private JlptLevel jlptLevel;

    @NotBlank(message = "MSG-FTEST-003")
    @Size(max = 50)
    private String skillFocus;

    @Valid
    @NotNull(message = "MSG-FTEST-001")
    @Size(min = 20, message = "MSG-FTEST-001")
    @Builder.Default
    private List<FinalTestQuestionDto> questions = new ArrayList<>();
}
