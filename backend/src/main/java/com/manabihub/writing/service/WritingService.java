package com.manabihub.writing.service;

import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingResultResponse;

import java.util.UUID;

public interface WritingService {

    WritingAssignmentResponse getAssignment(UUID lessonBlockId);

    WritingResultResponse submit(SubmitWritingRequest request);

}