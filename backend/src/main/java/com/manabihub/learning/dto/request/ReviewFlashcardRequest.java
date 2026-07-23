package com.manabihub.learning.dto.request;

import com.manabihub.learning.enums.FlashcardStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ReviewFlashcardRequest(
        @PositiveOrZero
        int cardIndex,

        @NotNull
        FlashcardStatus status
) {
}
