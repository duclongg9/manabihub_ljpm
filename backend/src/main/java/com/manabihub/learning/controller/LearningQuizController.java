package com.manabihub.learning.controller;

import com.manabihub.learning.dto.request.QuizSubmitRequest;
import com.manabihub.learning.dto.response.QuizSubmitResponse;
import com.manabihub.learning.service.LearningQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/courses/{courseId}/blocks/{blockId}/quiz")
@RequiredArgsConstructor
public class LearningQuizController {

    private final LearningQuizService learningQuizService;

    @PostMapping("/submit")
    public ResponseEntity<QuizSubmitResponse> submitQuiz(
            @PathVariable UUID courseId,
            @PathVariable UUID blockId,
            @Valid @RequestBody QuizSubmitRequest request) {
        return ResponseEntity.ok(learningQuizService.submitQuiz(courseId, blockId, request));
    }
}
