package com.manabihub.kyc.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.dto.response.KycRequestResponse;
import com.manabihub.kyc.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/kyc-requests")
@RequiredArgsConstructor
public class AdminKycController {

    private final KycService kycService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<KycRequestResponse>>> getPendingKycQueue(
            @RequestHeader(value = "X-Demo-Admin-Id", required = false) UUID adminId
    ) {
        if (adminId == null) adminId = UUID.fromString("c0000000-0000-0000-0000-000000000002");

        List<KycRequestResponse> queue = kycService.getPendingKycQueue(adminId);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Fetched pending KYC queue successfully",
                queue
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KycRequestResponse>> getKycDetail(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Demo-Admin-Id", required = false) UUID adminId
    ) {
        if (adminId == null) adminId = UUID.fromString("c0000000-0000-0000-0000-000000000002");

        KycRequestResponse detail = kycService.getKycDetail(id, adminId);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Fetched KYC detail successfully",
                detail
        ));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<KycRequestResponse>> reviewKyc(
            @PathVariable UUID id,
            @Valid @RequestBody KycReviewRequest reviewRequest,
            @RequestHeader(value = "X-Demo-Admin-Id", required = false) UUID adminId
    ) {
        if (adminId == null) adminId = UUID.fromString("c0000000-0000-0000-0000-000000000002");

        KycRequestResponse updated = kycService.reviewKyc(id, reviewRequest, adminId);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.ADMIN_ACTION_SUCCESS,
                "Reviewed KYC successfully",
                updated
        ));
    }
}
