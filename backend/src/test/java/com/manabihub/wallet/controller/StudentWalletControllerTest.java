package com.manabihub.wallet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.security.config.SecurityConfig;
import com.manabihub.security.oauth2.CustomOAuth2UserService;
import com.manabihub.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.manabihub.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.manabihub.wallet.dto.request.CreateTopUpRequest;
import com.manabihub.wallet.dto.response.StudentWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.service.StudentWalletService;
import com.manabihub.wallet.service.WalletTopUpService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StudentWalletController.class)
@Import({SecurityConfig.class, com.manabihub.security.DummyFilterConfig.class})
class StudentWalletControllerTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentWalletService studentWalletService;
    @MockBean
    private WalletTopUpService walletTopUpService;
    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;
    @MockBean
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    @MockBean
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Test
    void getWallet_asStudentReturnsSummary() throws Exception {
        when(studentWalletService.getWalletSummary()).thenReturn(new StudentWalletSummaryResponse(
                UUID.randomUUID(), "VND", new BigDecimal("25000.00"),
                BigDecimal.ZERO, new BigDecimal("500000.00"), BigDecimal.ZERO, Instant.now()));

        mockMvc.perform(get("/api/v1/student/wallet").with(studentJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageCode", org.hamcrest.Matchers.is("MSG-WALLET-001")))
                .andExpect(jsonPath("$.data.currency", org.hamcrest.Matchers.is("VND")))
                .andExpect(jsonPath("$.data.balance", org.hamcrest.Matchers.is(25000.00)));
    }

    @Test
    void getTransactions_asStudentReturnsActivity() throws Exception {
        when(studentWalletService.getWalletActivity()).thenReturn(List.of(new WalletActivityResponse(
                UUID.randomUUID(), WalletTransactionSection.PAYMENT, "ORDER",
                new BigDecimal("150000.00"), "VND", "OUT", "PAID", "OD1", null, Instant.now())));

        mockMvc.perform(get("/api/v1/student/wallet/transactions").with(studentJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.data[0].section", org.hamcrest.Matchers.is("PAYMENT")));
    }

    @Test
    void createTopUp_asStudentReturnsPendingRequestWithPaymentUrl() throws Exception {
        when(walletTopUpService.createTopUp(any(CreateTopUpRequest.class), anyString()))
                .thenReturn(topUp());

        mockMvc.perform(post("/api/v1/student/wallet/top-ups")
                        .with(studentJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(new CreateTopUpRequest(new BigDecimal("100000")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageCode", org.hamcrest.Matchers.is("MSG-WALLET-002")))
                .andExpect(jsonPath("$.data.status", org.hamcrest.Matchers.is("PENDING")))
                .andExpect(jsonPath("$.data.paymentUrl", org.hamcrest.Matchers.is("https://pay.test/vnpay")));
    }

    @Test
    void createTopUp_rejectsAmountBelowMinimumBeforeReachingTheService() throws Exception {
        mockMvc.perform(post("/api/v1/student/wallet/top-ups")
                        .with(studentJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(new CreateTopUpRequest(new BigDecimal("100")))))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(walletTopUpService);
    }

    /**
     * UC-17 exception 4b / BR-RBAC: a teacher must not reach the student wallet at all — the
     * top-up action included, since teacher money-out goes through the payout flow instead.
     */
    @Test
    void studentWalletActions_rejectTeacherRole() throws Exception {
        mockMvc.perform(get("/api/v1/student/wallet")
                        .with(teacherJwt()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/student/wallet/top-ups")
                        .with(teacherJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(new CreateTopUpRequest(new BigDecimal("100000")))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(studentWalletService);
        verifyNoInteractions(walletTopUpService);
    }

    @Test
    void wallet_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/student/wallet"))
                .andExpect(status().isUnauthorized());
    }

    private WalletTopUpResponse topUp() {
        return new WalletTopUpResponse(
                UUID.randomUUID(),
                "TU202607300001",
                new BigDecimal("100000.00"),
                "VND",
                WalletTopUpStatus.PENDING,
                "VNPAY",
                "https://pay.test/vnpay",
                Instant.now(),
                null);
    }

    private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor studentJwt() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"));
    }

    private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor teacherJwt() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER"));
    }
}
