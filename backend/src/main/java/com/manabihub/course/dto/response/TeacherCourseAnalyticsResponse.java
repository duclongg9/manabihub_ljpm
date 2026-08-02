package com.manabihub.course.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TeacherCourseAnalyticsResponse {
    private long activeStudents;
    private long completedStudents;
    private BigDecimal totalRevenue;
    private BigDecimal averageRating;
    private long totalReviews;
}
