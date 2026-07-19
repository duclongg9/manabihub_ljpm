package com.manabihub.writing.controller;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingResultResponse;
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

    @GetMapping("/assignment/{lessonBlockId}")
    public ApiResponse<WritingAssignmentResponse> getAssignment(
            @PathVariable UUID lessonBlockId
    ) {

        return ApiResponse.success(
                writingService.getAssignment(lessonBlockId)
        );
    }

    @PostMapping("/submit")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WritingResultResponse> submitWriting(
            @Valid @RequestBody SubmitWritingRequest request
    ) {

        return ApiResponse.success(
                writingService.submit(request)
        );
    }
}