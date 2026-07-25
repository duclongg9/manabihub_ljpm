package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.PageResponse;
import com.manabihub.wallet.dto.response.TeacherWalletOverviewResponse;
import com.manabihub.wallet.dto.response.WalletTransactionResponse;
import com.manabihub.wallet.dto.response.WithdrawalRequestResponse;
import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * UC-17 Manage My Wallet — Teacher side.
 * <p>
 * Read-only. Creating a withdrawal belongs to UC-27 and executing a payout to
 * UC-33; this controller only surfaces their outcome (BR-RBAC-03).
 */
@RestController
@RequestMapping("/api/v1/teacher/wallet")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherWalletController {

    private static final int MAX_PAGE_SIZE = 50;

    private final WalletService walletService;

    /**
     * UC-17 step 5: pending escrow, available balance and withdrawal eligibility.
     */
    @GetMapping
    public ApiResponse<TeacherWalletOverviewResponse> getWallet() {
        return ApiResponse.success(
                MessageCodes.WALLET_LOADED,
                "Wallet loaded.",
                walletService.getTeacherWalletOverview()
        );
    }

    /** UC-17 step 6: revenue and payout ledger history. */
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
                walletService.getTeacherTransactions(type, direction, from, to, toPageable(page, size))
        );
    }

    /** Withdrawal history together with the payout status of each request. */
    @GetMapping("/withdrawals")
    public ApiResponse<PageResponse<WithdrawalRequestResponse>> getWithdrawals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                MessageCodes.WALLET_WITHDRAWALS_LOADED,
                "Withdrawal history loaded.",
                walletService.getTeacherWithdrawals(toPageable(page, size))
        );
    }

    private Pageable toPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize);
    }
}
