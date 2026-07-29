package com.manabihub.wallet.controller;

import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.PayoutStatus;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.service.TeacherWalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
@Import({SecurityConfig.class, com.manabihub.security.DummyFilterConfig.class})
class TeacherWalletControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TeacherWalletService teacherWalletService;
    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;
    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    @MockBean
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Test
    void getWallet_asTeacherReturnsSummary() throws Exception {
        when(teacherWalletService.getWalletSummary()).thenReturn(new TeacherWalletSummaryResponse(
                UUID.randomUUID(), "VND", new BigDecimal("70000.00"), new BigDecimal("150000.00"),
                new BigDecimal("40000.00"), PayoutStatus.ESCROW_PENDING, Instant.now()));

        mockMvc.perform(get("/api/v1/teacher/wallet").with(teacherJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.payoutStatus", is("ESCROW_PENDING")))
                .andExpect(jsonPath("$.data.pendingEscrowBalance", is(150000.00)));
    }

    @Test
    void getPendingEscrow_asTeacherReturnsEntries() throws Exception {
        when(teacherWalletService.getPendingEscrow()).thenReturn(List.of(new EscrowEntryResponse(
                UUID.randomUUID(), UUID.randomUUID(), "OD1", UUID.randomUUID(), "N3 Grammar",
                new BigDecimal("150000.00"), "VND", EscrowStatus.HELD, Instant.now(), Instant.now())));

        mockMvc.perform(get("/api/v1/teacher/wallet/escrow").with(teacherJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status", is("HELD")));
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
