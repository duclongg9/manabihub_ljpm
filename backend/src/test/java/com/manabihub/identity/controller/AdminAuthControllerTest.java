package com.manabihub.identity.controller;

import com.manabihub.identity.service.AdminAuthService;
import com.manabihub.identity.service.InternalAdminInvitationService;
import com.manabihub.security.DummyFilterConfig;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminAuthController.class)
@Import({SecurityConfig.class, DummyFilterConfig.class})
@ActiveProfiles("test")
class AdminAuthControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private AdminAuthService adminAuthService;
    @MockBean private InternalAdminInvitationService invitationService;
    @MockBean private CustomOAuth2UserService customOAuth2UserService;
    @MockBean private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    @MockBean private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    @MockBean private ClientRegistrationRepository clientRegistrationRepository;

    @Test
    void anonymousRecipientCanSetPasswordWithInvitationToken() throws Exception {
        mockMvc.perform(post("/api/admin/auth/setup-password")
                        .contentType("application/json")
                        .header("User-Agent", "JUnit")
                        .content("""
                                {
                                  "token":"valid-one-time-token",
                                  "password":"StrongPassword!42"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageCode")
                        .value("INTERNAL_ADMIN_PASSWORD_SET"));

        verify(invitationService).accept(
                "valid-one-time-token",
                "StrongPassword!42",
                "127.0.0.1",
                "JUnit"
        );
    }

    @Test
    void setupPasswordRejectsMissingTokenBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/api/admin/auth/setup-password")
                        .contentType("application/json")
                        .content("""
                                {"token":" ","password":"StrongPassword!42"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.messageCode").value("VALIDATION_FAILED"));
    }
}
