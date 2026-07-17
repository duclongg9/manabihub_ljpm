package com.manabihub.writing.mapper;

import com.manabihub.ai.dto.response.AiWritingSuggestionResponse;
import com.manabihub.ai.entity.AiWritingSuggestion;
import com.manabihub.writing.dto.response.WritingResultResponse;
import com.manabihub.writing.dto.response.WritingSubmissionResponse;
import com.manabihub.writing.entity.WritingSubmission;
import org.springframework.stereotype.Component;

@Component
public class WritingMapper {

    public WritingSubmissionResponse toSubmissionResponse(WritingSubmission submission) {

        return WritingSubmissionResponse.builder()
                .id(submission.getId())
                .lessonBlockId(submission.getLessonBlock().getId())
                .content(submission.getContent())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    public AiWritingSuggestionResponse toSuggestionResponse(AiWritingSuggestion suggestion) {

        if (suggestion == null) {
            return null;
        }

        return AiWritingSuggestionResponse.builder()
                .id(suggestion.getId())
                .provider(suggestion.getProvider())
                .grammarSuggestions(suggestion.getGrammarSuggestions())
                .vocabularySuggestions(suggestion.getVocabularySuggestions())
                .structureSuggestions(suggestion.getStructureSuggestions())
                .revisionGuidance(suggestion.getRevisionGuidance())
                .confidenceLevel(suggestion.getConfidenceLevel())
                .createdAt(suggestion.getCreatedAt())
                .build();
    }

    public WritingResultResponse toResult(
            WritingSubmission submission,
            AiWritingSuggestion suggestion) {

        return WritingResultResponse.builder()
                .submission(toSubmissionResponse(submission))
                .suggestion(toSuggestionResponse(suggestion))
                .build();
    }
}