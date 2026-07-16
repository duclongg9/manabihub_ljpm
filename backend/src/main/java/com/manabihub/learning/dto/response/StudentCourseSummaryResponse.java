package com.manabihub.learning.dto.response;

import com.manabihub.learning.enums.EnrollmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class StudentCourseSummaryResponse {
    private UUID enrollmentId;
    private UUID courseId;
    private String courseTitle;
    private String thumbnailUrl;
    private String teacherName;
    private EnrollmentStatus enrollmentStatus;
    private Instant enrolledAt;
    private int progressPercentage;
}
