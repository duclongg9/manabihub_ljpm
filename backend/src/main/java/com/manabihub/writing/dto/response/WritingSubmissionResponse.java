package com.manabihub.writing.dto.response;

import com.manabihub.ai.dto.response.AiWritingSuggestionResponse;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Builder
@Getter
public class WritingSubmissionResponse {

    private UUID id;

    private UUID lessonBlockId;

    private WritingSubmissionStatus status;

    private String content;

    private Instant submittedAt;

    private AiWritingSuggestionResponse aiSuggestion;
}