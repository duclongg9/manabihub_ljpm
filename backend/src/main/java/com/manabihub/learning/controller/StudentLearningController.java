package com.manabihub.learning.controller;

import com.manabihub.common.response.PageResponse;
import com.manabihub.learning.dto.response.StudentCourseSummaryResponse;
import com.manabihub.learning.dto.response.StudentDashboardStatsResponse;
import com.manabihub.learning.service.StudentLearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<StudentDashboardStatsResponse> getDashboardStats(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(studentLearningService.getDashboardStats(userId));
    }

    @GetMapping("/courses")
    public ResponseEntity<PageResponse<StudentCourseSummaryResponse>> getEnrolledCourses(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 12) Pageable pageable) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(studentLearningService.getEnrolledCourses(userId, pageable));
    }
}
