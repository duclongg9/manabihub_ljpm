package com.manabihub.wallet.controller;

import com.manabihub.security.DummyFilterConfig;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.PayoutStatus;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.service.TeacherWalletService;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TeacherWalletController.class)
@Import({SecurityConfig.class, DummyFilterConfig.class})
@ActiveProfiles("test")
class TeacherWalletControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TeacherWalletService teacherWalletService;
    @MockBean
    private WalletService walletService;
    @MockBean
    private EscrowService escrowService;
    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;
    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    @MockBean
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    @MockBean
    private ClientRegistrationRepository clientRegistrationRepository;

    @Test
    void getWalletSummary_asTeacherReturnsSummary() throws Exception {
        when(teacherWalletService.getWalletSummary()).thenReturn(new TeacherWalletSummaryResponse(
                UUID.randomUUID(), "VND", new BigDecimal("70000.00"), new BigDecimal("150000.00"),
                new BigDecimal("40000.00"), PayoutStatus.ESCROW_PENDING, Instant.now()));

        mockMvc.perform(get("/api/v1/teacher/wallet/summary").with(teacherJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.payoutStatus", is("ESCROW_PENDING")))
                .andExpect(jsonPath("$.data.pendingEscrowBalance", is(150000.00)));
    }

    @Test
    @WithMockUser(username = "f1000000-0000-0000-0000-000000000001", roles = "TEACHER")
    void teacherCanReadWallet() throws Exception {
        UUID userId = UUID.fromString("f1000000-0000-0000-0000-000000000001");
        when(walletService.getTeacherWalletByUserId(userId)).thenReturn(
                TeacherWalletResponse.builder()
                        .availableBalance(new BigDecimal("900000.00"))
                        .pendingBalance(new BigDecimal("100000.00"))
                        .reservedBalance(BigDecimal.ZERO)
                        .build());

        mockMvc.perform(get("/api/v1/teacher/wallet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableBalance").value(900000.0))
                .andExpect(jsonPath("$.data.pendingBalance").value(100000.0));
    }



    @Test
    void getTransactions_asTeacherReturnsWithdrawalHistory() throws Exception {
        when(teacherWalletService.getWithdrawalHistory()).thenReturn(List.of(new WalletActivityResponse(
                UUID.randomUUID(), WalletTransactionSection.WITHDRAWAL, "PAYOUT",
                new BigDecimal("40000.00"), "VND", "OUT", "COMPLETED", null, null, Instant.now())));

        mockMvc.perform(get("/api/v1/teacher/wallet/transactions").with(teacherJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].section", is("WITHDRAWAL")));
    }

    @Test
    void wallet_rejectsStudentRole() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/wallet")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(teacherWalletService);
        verifyNoInteractions(walletService);
    }

    @Test
    void wallet_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/wallet"))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor teacherJwt() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER"));
    }
}
