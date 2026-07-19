package com.manabihub.writing.dto.response;

import com.manabihub.writing.enums.WritingSubmissionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class WritingSubmissionResponse {

    private UUID id;

    private UUID lessonBlockId;

    private String content;

    private WritingSubmissionStatus status;

    private Instant submittedAt;
}