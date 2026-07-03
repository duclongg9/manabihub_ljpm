package com.manabihub.kyc.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.enums.KycStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class AdminKycControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private final UUID seededKycId = UUID.fromString("b0000000-0000-0000-0000-000000000000");

    @Test
    void testGetPendingKycQueue() throws Exception {
        mockMvc.perform(get("/api/admin/kyc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.messageCode", is("COMMON_SUCCESS")))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].displayName", is("Eleanor Pena")));
    }

    @Test
    void testGetKycDetail() throws Exception {
        mockMvc.perform(get("/api/admin/kyc/" + seededKycId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.displayName", is("Eleanor Pena")))
                .andExpect(jsonPath("$.data.status", is("PENDING_ADMIN_REVIEW")));
    }

    @Test
    void testApproveKyc() throws Exception {
        KycReviewRequest reviewRequest = KycReviewRequest.builder()
                .status(KycStatus.APPROVED)
                .decisionNote("Looks good")
                .build();

        mockMvc.perform(post("/api/admin/kyc/" + seededKycId + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.messageCode", is("ADMIN_ACTION_SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("APPROVED")));
    }

    @Test
    void testRejectKycWithoutReasonFails() throws Exception {
        KycReviewRequest reviewRequest = KycReviewRequest.builder()
                .status(KycStatus.REJECTED)
                .decisionNote("") // Empty reason
                .build();

        mockMvc.perform(post("/api/admin/kyc/" + seededKycId + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.messageCode", is("VALIDATION_FAILED")));
    }
}
