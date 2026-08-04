package com.manabihub.writing.service;

import com.manabihub.common.response.PageResponse;
import com.manabihub.writing.dto.request.TeacherWritingFeedbackRequest;
import com.manabihub.writing.dto.response.WritingSubmissionDetailResponse;
import com.manabihub.writing.dto.response.WritingSubmissionSummaryResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface TeacherWritingReviewService {
    PageResponse<WritingSubmissionSummaryResponse> listSubmissions(
            String searchQuery,
            Boolean reviewed,
            Pageable pageable
    );

    WritingSubmissionDetailResponse getSubmission(UUID submissionId);

    WritingSubmissionDetailResponse saveFeedback(
            UUID submissionId,
            TeacherWritingFeedbackRequest request
    );
}
