package com.manabihub.learning.dto.response;

import com.manabihub.course.dto.response.FlashcardItemResponse;

import java.util.List;
import java.util.UUID;

public record FlashcardResponse(

        UUID lessonBlockId,

        String title,

        List<FlashcardItemResponse> flashcards

) {
}