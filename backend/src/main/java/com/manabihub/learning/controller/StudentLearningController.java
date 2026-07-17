package com.manabihub.learning.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.PageResponse;
import com.manabihub.learning.dto.response.StudentCourseSummaryResponse;
import com.manabihub.learning.dto.response.StudentDashboardStatsResponse;
import com.manabihub.learning.service.StudentLearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentLearningController {

    private final StudentLearningService studentLearningService;

    @GetMapping("/dashboard/stats")
    public ApiResponse<StudentDashboardStatsResponse> getDashboardStats(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Student dashboard statistics retrieved successfully",
                studentLearningService.getDashboardStats(userId));
    }

    @GetMapping("/courses")
    public ApiResponse<PageResponse<StudentCourseSummaryResponse>> getEnrolledCourses(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 12, sort = "enrolledAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Enrolled courses retrieved successfully",
                studentLearningService.getEnrolledCourses(userId, pageable));
    }
}
