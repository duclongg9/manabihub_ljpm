package com.manabihub.learning.dto.request;

import com.manabihub.learning.enums.FlashcardReviewStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReviewFlashcardRequest(

        @NotNull
        UUID lessonBlockId,

        @NotNull
        Integer cardIndex,

        @NotNull
        FlashcardReviewStatus status

) {
}