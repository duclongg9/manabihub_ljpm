package com.manabihub.learning.dto.response;

import com.manabihub.learning.enums.EnrollmentStatus;

import java.time.Instant;
import java.util.UUID;

public record MyCourseResponse(
        UUID courseId,
        String courseTitle,
        String slug,
        String thumbnailUrl,
        String levelCode,
        EnrollmentStatus enrollmentStatus,
        Instant enrolledAt,
        int totalLessons,
        int completedLessons,
        double progressPercent,
        boolean courseCompleted
) {
}
