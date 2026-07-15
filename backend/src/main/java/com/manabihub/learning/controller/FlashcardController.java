package com.manabihub.learning.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.learning.dto.request.FlashcardReviewRequest;
import com.manabihub.learning.dto.response.FlashcardSummaryResponse;
import com.manabihub.learning.dto.response.LearningFlashcardResponse;
import com.manabihub.learning.service.FlashcardReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardReviewService flashcardReviewService;

    @GetMapping("/{lessonBlockId}")
    public ResponseEntity<ApiResponse<List<LearningFlashcardResponse>>> getFlashcards(
            @PathVariable UUID lessonBlockId
    ) {

        List<LearningFlashcardResponse> response =
                flashcardReviewService.getFlashcards(lessonBlockId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.MSG_FLASHCARD_001,
                        "Flashcards retrieved successfully",
                        response
                )
        );

    }

    @PostMapping("/review")
    public ResponseEntity<ApiResponse<Void>> reviewFlashcard(
            @Valid @RequestBody FlashcardReviewRequest request
    ) {

        flashcardReviewService.reviewFlashcard(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.MSG_FLASHCARD_002,
                        "Flashcard reviewed successfully",
                        null
                )
        );

    }

    @GetMapping("/{lessonBlockId}/summary")
    public ResponseEntity<ApiResponse<FlashcardSummaryResponse>> getSummary(
            @PathVariable UUID lessonBlockId
    ) {

        FlashcardSummaryResponse response =
                flashcardReviewService.getSummary(lessonBlockId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.MSG_FLASHCARD_003,
                        "Flashcard summary retrieved successfully",
                        response
                )
        );

    }

}