package com.manabihub.writing.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.PageResponse;
import com.manabihub.writing.dto.request.TeacherWritingFeedbackRequest;
import com.manabihub.writing.dto.response.WritingSubmissionDetailResponse;
import com.manabihub.writing.dto.response.WritingSubmissionSummaryResponse;
import com.manabihub.writing.service.TeacherWritingReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teacher/writing-submissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherWritingReviewController {

    private final TeacherWritingReviewService teacherWritingReviewService;

    @GetMapping
    public ApiResponse<PageResponse<WritingSubmissionSummaryResponse>> listSubmissions(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) Boolean reviewed,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.success(
                teacherWritingReviewService.listSubmissions(query, reviewed, pageable)
        );
    }

    @GetMapping("/{submissionId}")
    public ApiResponse<WritingSubmissionDetailResponse> getSubmission(
            @PathVariable UUID submissionId
    ) {
        return ApiResponse.success(teacherWritingReviewService.getSubmission(submissionId));
    }

    @PutMapping("/{submissionId}/feedback")
    public ApiResponse<WritingSubmissionDetailResponse> saveFeedback(
            @PathVariable UUID submissionId,
            @Valid @RequestBody TeacherWritingFeedbackRequest request
    ) {
        return ApiResponse.success(
                MessageCodes.TEACHER_FEEDBACK_SUBMITTED,
                "Teacher feedback saved",
                teacherWritingReviewService.saveFeedback(submissionId, request)
        );
    }
}
