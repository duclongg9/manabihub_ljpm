package com.manabihub.writing.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class WritingAssignmentResponse {

    private UUID lessonBlockId;

    private String title;

    private String prompt;

    private String rubric;

    private Integer minCharacters;

    private Integer maxCharacters;

}