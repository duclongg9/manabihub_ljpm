package com.manabihub.learning.service;

import com.manabihub.learning.dto.request.FlashcardReviewRequest;
import com.manabihub.learning.dto.response.FlashcardSummaryResponse;
import com.manabihub.learning.dto.response.LearningFlashcardResponse;

import java.util.List;
import java.util.UUID;

public interface FlashcardReviewService {

    List<LearningFlashcardResponse> getFlashcards(UUID lessonBlockId);

    void reviewFlashcard(FlashcardReviewRequest request);

    FlashcardSummaryResponse getSummary(UUID lessonBlockId);

}