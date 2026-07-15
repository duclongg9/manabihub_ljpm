package com.manabihub.learning.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FlashcardSummaryResponse {

    private int totalCards;

    private int remembered;

    private int needReview;

    private int skipped;

    private double completion;

}