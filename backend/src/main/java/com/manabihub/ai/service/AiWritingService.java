package com.manabihub.ai.service;

import com.manabihub.ai.entity.AiWritingSuggestion;
import com.manabihub.writing.entity.WritingSubmission;

public interface AiWritingService {

    AiWritingSuggestion generateSuggestion(WritingSubmission submission);

}