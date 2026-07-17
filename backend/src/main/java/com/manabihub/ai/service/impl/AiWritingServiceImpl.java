package com.manabihub.ai.service.impl;

import com.manabihub.ai.entity.AiWritingSuggestion;
import com.manabihub.ai.enums.SuggestionStatus;
import com.manabihub.ai.repository.AiWritingSuggestionRepository;
import com.manabihub.ai.service.AiWritingService;
import com.manabihub.writing.entity.WritingSubmission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AiWritingServiceImpl implements AiWritingService {

    private final AiWritingSuggestionRepository suggestionRepository;

    @Override
    public AiWritingSuggestion generateSuggestion(WritingSubmission submission) {

        AiWritingSuggestion suggestion = AiWritingSuggestion.builder()
                .writingSubmission(submission)
                .provider("MANABI_AI")
                .suggestionStatus(SuggestionStatus.READY)
                .grammarSuggestions("[]")
                .vocabularySuggestions("[]")
                .structureSuggestions("[]")
                .revisionGuidance("AI writing assistance is not available yet.")
                .confidenceLevel("LOW")
                .official(false)
                .rawResponse("{}")
                .build();

        return suggestionRepository.save(suggestion);
    }
}