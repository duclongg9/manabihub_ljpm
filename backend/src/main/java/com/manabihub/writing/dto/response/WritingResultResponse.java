package com.manabihub.writing.dto.response;

import com.manabihub.ai.dto.response.AiWritingSuggestionResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WritingResultResponse {

    private WritingSubmissionResponse submission;

    private AiWritingSuggestionResponse suggestion;
}