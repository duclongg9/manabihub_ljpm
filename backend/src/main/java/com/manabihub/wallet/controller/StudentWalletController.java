package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.PageResponse;
import com.manabihub.wallet.dto.request.CreateWalletTopUpRequest;
import com.manabihub.wallet.dto.response.StudentWalletOverviewResponse;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;
import com.manabihub.wallet.dto.response.WalletTransactionResponse;
import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * UC-17 Manage My Wallet — Student side.
 * <p>
 * BR-RBAC-01 / UC-17 exception 4b: withdrawal endpoints simply do not exist
 * here, so a Student can never reach a payout action. The class-level
 * {@code @PreAuthorize} blocks every other role.
 */
@RestController
@RequestMapping("/api/v1/student/wallet")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentWalletController {

    private static final int MAX_PAGE_SIZE = 50;

    private final WalletService walletService;

    /** UC-17 step 3 and 4: wallet overview with top-up/payment/refund sections. */
    @GetMapping
    public ApiResponse<StudentWalletOverviewResponse> getWallet() {
        return ApiResponse.success(
                MessageCodes.WALLET_LOADED,
                "Wallet loaded.",
                walletService.getStudentWalletOverview()
        );
    }

    /** UC-17 step 6: filterable transaction history. */
    @GetMapping("/transactions")
    public ApiResponse<PageResponse<WalletTransactionResponse>> getTransactions(
            @RequestParam(required = false) WalletTransactionType type,
            @RequestParam(required = false) WalletTransactionDirection direction,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                MessageCodes.WALLET_TRANSACTIONS_LOADED,
                "Wallet transactions loaded.",
                walletService.getStudentTransactions(type, direction, from, to, toPageable(page, size))
        );
    }

    /** Top-up section history. */
    @GetMapping("/top-ups")
    public ApiResponse<PageResponse<WalletTopUpResponse>> getTopUps(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Wallet top-up history loaded.",
                walletService.getStudentTopUps(toPageable(page, size))
        );
    }

    /**
     * UC-17 alternative flow 4a: start a top-up. The response is a pending
     * request; the balance only moves after the backend confirms the payment.
     */
    @PostMapping("/top-ups")
    public ApiResponse<WalletTopUpResponse> createTopUp(
            @Valid @RequestBody CreateWalletTopUpRequest request
    ) {
        return ApiResponse.success(
                MessageCodes.WALLET_TOP_UP_CREATED,
                "Wallet top-up request created.",
                walletService.createTopUpRequest(request)
        );
    }

    private Pageable toPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize);
    }
}
