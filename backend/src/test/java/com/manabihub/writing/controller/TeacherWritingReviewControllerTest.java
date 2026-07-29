package com.manabihub.writing.controller;

import com.manabihub.common.response.PageResponse;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.manabihub.writing.dto.response.WritingSubmissionDetailResponse;
import com.manabihub.writing.dto.response.WritingSubmissionSummaryResponse;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.service.TeacherWritingReviewService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TeacherWritingReviewController.class)
@Import({SecurityConfig.class, com.manabihub.security.DummyFilterConfig.class})
class TeacherWritingReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TeacherWritingReviewService teacherWritingReviewService;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockBean
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Test
    void listSubmissions_asTeacher_returnsPage() throws Exception {
        PageResponse<WritingSubmissionSummaryResponse> page =
                PageResponse.<WritingSubmissionSummaryResponse>builder()
                .content(List.of())
                .page(0)
                .size(10)
                .totalElements(0)
                .totalPages(0)
                .first(true)
                .last(true)
                        .build();
        when(teacherWritingReviewService.listSubmissions(eq(""), eq(null), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/teacher/writing-submissions")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void getSubmission_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/writing-submissions/{id}", UUID.randomUUID())
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void saveFeedback_withBlankComment_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/v1/teacher/writing-submissions/{id}/feedback", UUID.randomUUID())
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER")))
                        .contentType("application/json")
                        .content("{\"score\":8.5,\"comment\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.messageCode").value("VALIDATION_FAILED"));
    }

    @ParameterizedTest(name = "UTC boundary accepted: score={0}")
    @ValueSource(strings = {"0", "10"})
    void saveFeedback_withScoreAtInclusiveBoundary_returnsOk(String score) throws Exception {
        mockMvc.perform(put("/api/v1/teacher/writing-submissions/{id}/feedback", UUID.randomUUID())
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER")))
                        .contentType("application/json")
                        .content("{\"score\":" + score + ",\"comment\":\"Boundary score\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageCode").value("TEACHER_FEEDBACK_SUBMITTED"));
    }

    @ParameterizedTest(name = "UTC boundary rejected: score={0}")
    @ValueSource(strings = {"-0.01", "10.01"})
    void saveFeedback_withScoreOutsideInclusiveBoundary_returnsBadRequest(String score) throws Exception {
        mockMvc.perform(put("/api/v1/teacher/writing-submissions/{id}/feedback", UUID.randomUUID())
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER")))
                        .contentType("application/json")
                        .content("{\"score\":" + score + ",\"comment\":\"Invalid score\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.messageCode").value("VALIDATION_FAILED"));
    }

    @Test
    void saveFeedback_asTeacher_returnsUpdatedDetail() throws Exception {
        UUID submissionId = UUID.randomUUID();
        WritingSubmissionDetailResponse response = new WritingSubmissionDetailResponse(
                submissionId,
                UUID.randomUUID(),
                "N3 Writing",
                "Self introduction",
                "Student A",
                "student@example.com",
                "Japanese writing",
                WritingSubmissionStatus.TEACHER_FEEDBACK_READY,
                Instant.now(),
                null,
                null
        );
        when(teacherWritingReviewService.saveFeedback(eq(submissionId), any()))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/teacher/writing-submissions/{id}/feedback", submissionId)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER")))
                        .contentType("application/json")
                        .content("{\"score\":8.5,\"comment\":\"Good revision.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageCode").value("TEACHER_FEEDBACK_SUBMITTED"))
                .andExpect(jsonPath("$.data.id").value(submissionId.toString()));
    }
}
