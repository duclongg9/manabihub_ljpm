package com.manabihub.ai.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AiWritingSuggestionResponse {

    private UUID id;

    private String provider;

    private String grammarSuggestions;

    private String vocabularySuggestions;

    private String structureSuggestions;

    private String revisionGuidance;

    private String confidenceLevel;

    private Instant createdAt;
}