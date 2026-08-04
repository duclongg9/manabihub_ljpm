package com.manabihub.ai.domain;

import java.util.UUID;

/**
 * Context intentionally contains one lesson block and course metadata only.
 * It must never be populated from another course or lesson block.
 */
public record AiChatContext(
        UUID courseId,
        UUID lessonBlockId,
        String courseTitle,
        String courseDescription,
        String courseOutcomes,
        String lessonTitle,
        String lessonContent
) {
}
