package com.manabihub.security;

import com.manabihub.common.response.PageResponse;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.config.TeacherEligibilityFilter;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.manabihub.course.controller.TeacherDashboardController;
import com.manabihub.course.dto.response.TeacherDashboardResponse;
import com.manabihub.course.service.CourseService;
import com.manabihub.writing.controller.TeacherWritingReviewController;
import com.manabihub.writing.dto.response.WritingSubmissionSummaryResponse;
import com.manabihub.writing.service.TeacherWritingReviewService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test verifying the {@link TeacherEligibilityFilter} correctly gates
 * all {@code /api/v1/teacher/**} endpoints based on live database role checks,
 * even when the JWT still carries a stale {@code ROLE_TEACHER} claim.
 */
@WebMvcTest({TeacherDashboardController.class, TeacherWritingReviewController.class})
@Import({SecurityConfig.class, TeacherEligibilityFilter.class})
class TeacherEligibilityFilterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CourseService courseService;

    @MockBean
    private TeacherWritingReviewService teacherWritingReviewService;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockBean
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    private static final UUID TEACHER_ROLE_ID = UUID.fromString("a0000000-0000-0000-0000-000000000002");

    // ──────────────────────────────────────────────
    // Active Teacher — DB role exists → 200
    // ──────────────────────────────────────────────

    @Test
    void activeTeacher_dashboardReturns200() throws Exception {
        UUID userId = UUID.randomUUID();

        // DB has TEACHER role
        when(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role_id = ?",
                Integer.class, userId, TEACHER_ROLE_ID))
                .thenReturn(1);

        when(courseService.getTeacherDashboardStats())
                .thenReturn(TeacherDashboardResponse.builder()
                        .totalCourses(0).draftOrCorrection(0).pendingApproval(0).published(0)
                        .recentCourses(java.util.List.of()).build());

        mockMvc.perform(get("/api/v1/teacher/dashboard")
                        .with(jwt().jwt(j -> j.subject(userId.toString()).claim("role", "TEACHER"))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isOk());
    }

    @Test
    void activeTeacher_writingSubmissionsReturns200() throws Exception {
        UUID userId = UUID.randomUUID();

        when(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role_id = ?",
                Integer.class, userId, TEACHER_ROLE_ID))
                .thenReturn(1);

        PageResponse<WritingSubmissionSummaryResponse> page =
                PageResponse.<WritingSubmissionSummaryResponse>builder()
                        .content(java.util.List.of())
                        .page(0).size(10).totalElements(0).totalPages(0)
                        .first(true).last(true).build();
        when(teacherWritingReviewService.listSubmissions(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/teacher/writing-submissions")
                        .with(jwt().jwt(j -> j.subject(userId.toString()).claim("role", "TEACHER"))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isOk());
    }

    // ──────────────────────────────────────────────
    // Quarantined Teacher — DB role revoked, JWT still carries ROLE_TEACHER → 403
    // ──────────────────────────────────────────────

    @Test
    void quarantinedTeacher_staleJwt_dashboardReturns403() throws Exception {
        UUID userId = UUID.randomUUID();

        // DB role REVOKED (quarantine)
        when(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role_id = ?",
                Integer.class, userId, TEACHER_ROLE_ID))
                .thenReturn(0);

        mockMvc.perform(get("/api/v1/teacher/dashboard")
                        .with(jwt().jwt(j -> j.subject(userId.toString()).claim("role", "TEACHER"))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.messageCode").value("AUTH_FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Teacher eligibility revoked — account quarantined"));
    }

    @Test
    void quarantinedTeacher_staleJwt_writingReviewReturns403() throws Exception {
        UUID userId = UUID.randomUUID();

        when(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role_id = ?",
                Integer.class, userId, TEACHER_ROLE_ID))
                .thenReturn(0);

        mockMvc.perform(get("/api/v1/teacher/writing-submissions")
                        .with(jwt().jwt(j -> j.subject(userId.toString()).claim("role", "TEACHER"))
                                .authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.messageCode").value("AUTH_FORBIDDEN"));
    }

    // ──────────────────────────────────────────────
    // Student accessing Teacher endpoint → 403 (existing @PreAuthorize)
    // ──────────────────────────────────────────────

    @Test
    void student_teacherDashboardReturns403() throws Exception {
        UUID userId = UUID.randomUUID();

        // Student has no TEACHER role in DB (won't even be checked because @PreAuthorize catches first)
        mockMvc.perform(get("/api/v1/teacher/dashboard")
                        .with(jwt().jwt(j -> j.subject(userId.toString()).claim("role", "STUDENT"))
                                .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }
}
