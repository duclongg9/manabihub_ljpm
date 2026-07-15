package com.manabihub.learning.dto.request;

import com.manabihub.learning.enums.FlashcardReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class FlashcardReviewRequest {

    @NotNull
    private UUID lessonBlockId;

    @NotNull
    private Integer cardIndex;

    @NotNull
    private FlashcardReviewStatus status;

}