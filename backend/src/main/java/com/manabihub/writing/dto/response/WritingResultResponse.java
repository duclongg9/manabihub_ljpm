package com.manabihub.writing.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WritingResultResponse {

    private WritingSubmissionResponse submission;

    private AiWritingSuggestionResponse suggestion;
}