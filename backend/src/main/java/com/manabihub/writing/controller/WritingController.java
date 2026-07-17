package com.manabihub.writing.controller;

import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingSubmissionResponse;
import com.manabihub.writing.service.WritingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/student/writing")
public class WritingController {

    private final WritingService writingService;

    @GetMapping("/{lessonBlockId}")
    public WritingAssignmentResponse getAssignment(
            @PathVariable UUID lessonBlockId
    ) {
        return writingService.getAssignment(lessonBlockId);
    }

    @PostMapping("/{lessonBlockId}/submit")
    @ResponseStatus(HttpStatus.CREATED)
    public WritingSubmissionResponse submitWriting(
            @PathVariable UUID lessonBlockId,
            @Valid @RequestBody SubmitWritingRequest request
    ) {
        return writingService.submitWriting(
                lessonBlockId,
                request
        );
    }

    @GetMapping("/submissions/{submissionId}")
    public WritingSubmissionResponse getSubmission(
            @PathVariable UUID submissionId
    ) {
        return writingService.getSubmission(submissionId);
    }
}