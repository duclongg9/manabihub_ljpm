package com.manabihub.finaltest.dto.response;

import com.manabihub.course.enums.JlptLevel;
import com.manabihub.finaltest.dto.request.FinalTestQuestionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalTestResponse {

    private UUID id;
    private UUID courseId;
    private Integer timeLimitMinutes;
    private Integer passingScore;
    private Integer maxRetakes;
    private JlptLevel jlptLevel;
    private String skillFocus;

    @Builder.Default
    private List<FinalTestQuestionDto> questions = new ArrayList<>();
}
