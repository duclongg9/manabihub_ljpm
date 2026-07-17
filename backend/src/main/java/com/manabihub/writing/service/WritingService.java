package com.manabihub.writing.service;

import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingResultResponse;

import java.util.UUID;

public interface WritingService {

    WritingResultResponse submitWriting(SubmitWritingRequest request);

    WritingAssignmentResponse getWritingAssignment(UUID lessonBlockId);
}