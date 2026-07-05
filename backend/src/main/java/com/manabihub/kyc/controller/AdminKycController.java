package com.manabihub.kyc.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.dto.response.KycRequestResponse;
import com.manabihub.kyc.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/kyc-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdminKycController {

    private final KycService kycService;

    // Seeded Course Manager UUID used as default fallback for local dev/testing
    private static final String DEFAULT_MANAGER_ID = "c0000000-0000-0000-0000-000000000002";

    @GetMapping
    public ResponseEntity<ApiResponse<List<KycRequestResponse>>> getPendingKycQueue(
            @RequestHeader(value = "X-Admin-Id", required = false) String adminIdHeader
    ) {
        UUID adminId = (adminIdHeader == null || adminIdHeader.isEmpty())
                ? UUID.fromString(DEFAULT_MANAGER_ID)
                : UUID.fromString(adminIdHeader);

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
            @RequestHeader(value = "X-Admin-Id", required = false) String adminIdHeader
    ) {
        UUID adminId = (adminIdHeader == null || adminIdHeader.isEmpty())
                ? UUID.fromString(DEFAULT_MANAGER_ID)
                : UUID.fromString(adminIdHeader);

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
            @RequestHeader(value = "X-Admin-Id", required = false) String adminIdHeader
    ) {
        UUID adminId = (adminIdHeader == null || adminIdHeader.isEmpty())
                ? UUID.fromString(DEFAULT_MANAGER_ID)
                : UUID.fromString(adminIdHeader);

        KycRequestResponse updated = kycService.reviewKyc(id, reviewRequest, adminId);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.ADMIN_ACTION_SUCCESS,
                "Reviewed KYC successfully",
                updated
        ));
    }
}
