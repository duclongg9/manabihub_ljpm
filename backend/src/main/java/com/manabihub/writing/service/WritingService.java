package com.manabihub.writing.service;

import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingSubmissionResponse;

import java.util.UUID;

public interface WritingService {

    /**
     * Lấy thông tin bài tập viết.
     */
    WritingAssignmentResponse getAssignment(UUID lessonBlockId);

    /**
     * Nộp bài viết.
     */
    WritingSubmissionResponse submitWriting(
            UUID lessonBlockId,
            SubmitWritingRequest request);

    /**
     * Xem bài viết đã nộp.
     */
    WritingSubmissionResponse getSubmission(UUID submissionId);
}