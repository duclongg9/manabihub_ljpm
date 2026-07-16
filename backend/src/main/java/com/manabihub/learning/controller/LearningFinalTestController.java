package com.manabihub.learning.controller;

import com.manabihub.learning.dto.request.FinalTestSubmitRequest;
import com.manabihub.learning.dto.response.FinalTestEligibilityResponse;
import com.manabihub.learning.dto.response.FinalTestSubmitResponse;
import com.manabihub.learning.service.LearningFinalTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/courses/{courseId}/final-test")
@RequiredArgsConstructor
public class LearningFinalTestController {

    private final LearningFinalTestService finalTestService;

    @GetMapping("/eligibility")
    public ResponseEntity<FinalTestEligibilityResponse> checkEligibility(@PathVariable UUID courseId) {
        return ResponseEntity.ok(finalTestService.checkEligibility(courseId));
    }

    @PostMapping("/start")
    public ResponseEntity<java.util.Map<String, String>> startFinalTest(@PathVariable UUID courseId) {
        UUID attemptId = finalTestService.startFinalTestAttempt(courseId);
        return ResponseEntity.ok(java.util.Map.of(
            "attemptId", attemptId.toString(),
            "message", "Test started successfully. Attempt counted."
        ));
    }

    @PostMapping("/submit")
    public ResponseEntity<FinalTestSubmitResponse> submitFinalTest(
            @PathVariable UUID courseId,
            @Valid @RequestBody FinalTestSubmitRequest request) {
        return ResponseEntity.ok(finalTestService.submitFinalTest(courseId, request));
    }

    @GetMapping("/certificate-eligibility")
    public ResponseEntity<Boolean> isEligibleForCertificate(@PathVariable UUID courseId) {
        return ResponseEntity.ok(finalTestService.isEligibleForCertificate(courseId));
    }
}
