package com.manabihub.learning.service;

import com.manabihub.learning.dto.request.ReviewFlashcardRequest;
import com.manabihub.learning.dto.response.FlashcardResponse;
import com.manabihub.learning.dto.response.FlashcardSummaryResponse;

import java.util.UUID;

public interface FlashcardService {

    FlashcardResponse getFlashcards(UUID lessonBlockId);

    void reviewFlashcard(ReviewFlashcardRequest request);

    FlashcardSummaryResponse getSummary(UUID lessonBlockId);

}