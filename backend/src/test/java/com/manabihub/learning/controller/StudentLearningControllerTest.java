package com.manabihub.learning.controller;

import com.manabihub.common.response.PageResponse;
import com.manabihub.learning.dto.response.StudentCourseSummaryResponse;
import com.manabihub.learning.dto.response.StudentDashboardStatsResponse;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.service.StudentLearningService;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StudentLearningController.class)
@Import(SecurityConfig.class)
class StudentLearningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentLearningService studentLearningService;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockBean
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Test
    void getDashboardStats_success() throws Exception {
        UUID userId = UUID.randomUUID();
        StudentDashboardStatsResponse response = StudentDashboardStatsResponse.builder()
                .totalEnrolledCourses(5)
                .activeCourses(3)
                .completedCourses(2)
                .build();

        when(studentLearningService.getDashboardStats(userId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/student/dashboard/stats")
                        .with(jwt().jwt(builder -> builder.subject(userId.toString())).authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEnrolledCourses", is(5)))
                .andExpect(jsonPath("$.activeCourses", is(3)))
                .andExpect(jsonPath("$.completedCourses", is(2)));
    }

    @Test
    void getDashboardStats_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/student/dashboard/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getDashboardStats_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/student/dashboard/stats")
                        .with(jwt().jwt(builder -> builder.subject(UUID.randomUUID().toString())).authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getEnrolledCourses_success() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID enrollmentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        StudentCourseSummaryResponse summary = StudentCourseSummaryResponse.builder()
                .enrollmentId(enrollmentId)
                .courseId(courseId)
                .courseTitle("Test Course")
                .thumbnailUrl("http://example.com/thumb.jpg")
                .teacherName("John Doe")
                .enrollmentStatus(EnrollmentStatus.ACTIVE)
                .enrolledAt(Instant.now())
                .build();

        PageResponse<StudentCourseSummaryResponse> pageResponse = PageResponse.<StudentCourseSummaryResponse>builder()
                .content(List.of(summary))
                .page(0)
                .size(12)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();

        when(studentLearningService.getEnrolledCourses(eq(userId), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/student/courses")
                        .with(jwt().jwt(builder -> builder.subject(userId.toString())).authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].courseTitle", is("Test Course")))
                .andExpect(jsonPath("$.content[0].enrollmentStatus", is("ACTIVE")));
    }

    @Test
    void getEnrolledCourses_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/student/courses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getEnrolledCourses_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/student/courses")
                        .with(jwt().jwt(builder -> builder.subject(UUID.randomUUID().toString())).authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isForbidden());
    }
}
