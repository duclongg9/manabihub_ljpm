package com.manabihub.writing.service;

import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingResultResponse;

public interface WritingService {

    WritingResultResponse submitWriting(SubmitWritingRequest request);

}