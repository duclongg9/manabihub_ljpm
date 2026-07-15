package com.manabihub.learning.dto.response;

import com.manabihub.learning.enums.FlashcardReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningFlashcardResponse {

    private Integer cardIndex;

    private String front;

    private String back;

    private FlashcardReviewStatus reviewStatus;

}