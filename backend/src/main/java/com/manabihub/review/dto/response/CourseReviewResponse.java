package com.manabihub.review.dto.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Public-safe review representation. Student identifiers, email and phone are
 * intentionally absent.
 */
public record CourseReviewResponse(
        UUID id,
        int rating,
        String reviewText,
        String authorDisplayName,
        String authorAvatarUrl,
        Instant updatedAt
) {
}
