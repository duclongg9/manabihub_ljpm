package com.manabihub.learning.dto.response;

import java.util.List;
import java.util.UUID;

public record CourseLearningResponse(
        UUID courseId,
        String courseTitle,
        UUID enrollmentId,
        List<LearningModuleResponse> modules,
        UUID currentLessonBlockId,
        int totalLessons,
        int completedLessons,
        double progressPercent,
        boolean courseCompleted,
        List<String> warnings
) {
}
