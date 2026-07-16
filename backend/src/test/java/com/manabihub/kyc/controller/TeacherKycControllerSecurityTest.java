package com.manabihub.kyc.controller;

import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TeacherKycController.class)
@AutoConfigureMockMvc
@Import(SecurityConfig.class)
class TeacherKycControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TeacherKycService teacherKycService;

    @MockBean
    private CurrentUserService currentUserService;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @MockBean
    private OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;

    @MockBean
    private OAuth2AuthenticationFailureHandler oauth2AuthenticationFailureHandler;

    @Test
    void statusRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/kyc/status"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(currentUserService, teacherKycService);
    }

    @Test
    void statusUsesAuthenticatedIdentityAndIgnoresDemoHeader() throws Exception {
        UUID authenticatedUserId = UUID.randomUUID();
        UUID forgedUserId = UUID.randomUUID();
        when(currentUserService.getCurrentUserId()).thenReturn(authenticatedUserId);

        mockMvc.perform(get("/api/v1/teacher/kyc/status")
                        .header("X-Demo-User-Id", forgedUserId)
                        .with(jwt().jwt(jwt -> jwt.subject(authenticatedUserId.toString()))))
                .andExpect(status().isOk());

        verify(teacherKycService).getStatus(authenticatedUserId);
        verify(teacherKycService, never()).getStatus(forgedUserId);
    }
}
