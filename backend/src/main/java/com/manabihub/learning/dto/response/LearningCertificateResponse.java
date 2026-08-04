package com.manabihub.learning.dto.response;

import java.time.Instant;
import java.util.UUID;

public record LearningCertificateResponse(
        UUID id,
        UUID enrollmentId,
        UUID courseId,
        String certificateNumber,
        String studentName,
        String courseTitle,
        Instant issuedAt
) {
}
