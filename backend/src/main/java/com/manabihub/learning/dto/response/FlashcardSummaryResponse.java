package com.manabihub.learning.dto.response;

public record FlashcardSummaryResponse(

        int totalCards,

        long remembered,

        long needReview,

        long skipped

) {
}