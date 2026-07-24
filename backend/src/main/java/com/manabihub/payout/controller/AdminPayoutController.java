package com.manabihub.payout.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.payout.dto.request.ManualTransferRequest;
import com.manabihub.payout.dto.request.RejectPayoutRequest;
import com.manabihub.payout.dto.response.PayoutDetailResponse;
import com.manabihub.payout.dto.response.PayoutQueueItemResponse;
import com.manabihub.payout.service.PayoutSettlementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/payouts")
@RequiredArgsConstructor
@Tag(name = "Admin Payout", description = "Admin APIs for managing payouts")
public class AdminPayoutController {

    private final PayoutSettlementService payoutSettlementService;

    @Operation(summary = "Get payout queue")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PayoutQueueItemResponse>>> getPayoutQueue(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Fetched payout queue successfully",
                payoutSettlementService.getPayoutQueue(pageable)
        ));
    }

    @Operation(summary = "Get payout details")
    @GetMapping("/{withdrawalRequestId}")
    public ResponseEntity<ApiResponse<PayoutDetailResponse>> getPayoutDetail(@PathVariable UUID withdrawalRequestId) {
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Fetched payout detail successfully",
                payoutSettlementService.getPayoutDetail(withdrawalRequestId)
        ));
    }

    @Operation(summary = "Approve payout")
    @PostMapping("/{withdrawalRequestId}/approve")
    public ResponseEntity<ApiResponse<Void>> approvePayout(@PathVariable UUID withdrawalRequestId) {
        payoutSettlementService.approvePayout(withdrawalRequestId);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.PAYOUT_SETTLEMENT_COMPLETED,
                "Payout settlement completed",
                null
        ));
    }

    @Operation(summary = "Reject payout")
    @PostMapping("/{withdrawalRequestId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectPayout(
            @PathVariable UUID withdrawalRequestId,
            @Valid @RequestBody RejectPayoutRequest request) {
        payoutSettlementService.rejectPayout(withdrawalRequestId, request);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.PAYOUT_REJECTED,
                "Payout request rejected",
                null
        ));
    }

    @Operation(summary = "Confirm manual transfer")
    @PostMapping("/{withdrawalRequestId}/manual-transfer")
    public ResponseEntity<ApiResponse<Void>> confirmManualTransfer(
            @PathVariable UUID withdrawalRequestId,
            @Valid @RequestBody ManualTransferRequest request) {
        payoutSettlementService.confirmManualTransfer(withdrawalRequestId, request);
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.PAYOUT_SETTLEMENT_COMPLETED,
                "Manual transfer confirmed",
                null
        ));
    }
}
