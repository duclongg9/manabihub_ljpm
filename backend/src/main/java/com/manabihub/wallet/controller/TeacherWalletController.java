package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.service.TeacherWalletService;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * UC-17 "My Wallet" — teacher view. Exposes pending escrow, available balance,
 * withdrawal history and payout status; student-only fields such as top-up totals
 * are never returned here (BR-RBAC).
 * <p>
 * The class-level {@code hasRole('TEACHER')} is what enforces exception 4b: a student
 * cannot reach the withdrawal/payout surface at all. Teacher revenue is likewise not
 * exposed as a spendable student payment balance (exception 5b) — the two roles resolve
 * different wallets and neither controller can see the other's.
 */
@RestController
@RequestMapping("/api/v1/teacher/wallet")
@RequiredArgsConstructor
@Tag(name = "Teacher Wallet", description = "Teacher Revenue Wallet Operations")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherWalletController {

    private final TeacherWalletService teacherWalletService;
    private final WalletService walletService;
    private final EscrowService escrowService;

    @GetMapping("/summary")
    @Operation(summary = "Get detailed wallet summary")
    public ApiResponse<TeacherWalletSummaryResponse> getWalletSummary() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Wallet loaded.",
                teacherWalletService.getWalletSummary()
        );
    }

    @GetMapping
    @Operation(summary = "Get teacher wallet details")
    public ApiResponse<TeacherWalletResponse> getWallet(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        TeacherWalletResponse response = walletService.getTeacherWalletByUserId(userId);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", response);
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get withdrawal history")
    public ApiResponse<List<WalletActivityResponse>> getWithdrawalHistory() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Withdrawal history loaded.",
                teacherWalletService.getWithdrawalHistory()
        );
    }

    @GetMapping("/escrow")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get teacher escrow ledger history")
    public ApiResponse<org.springframework.data.domain.Page<com.manabihub.wallet.dto.response.EscrowLedgerResponse>> getEscrowLedger(
            Authentication authentication,
            org.springframework.data.domain.Pageable pageable) {
        UUID userId = UUID.fromString(authentication.getName());
        org.springframework.data.domain.Page<com.manabihub.wallet.dto.response.EscrowLedgerResponse> response = escrowService.getTeacherEscrowLedgerByUserId(userId, pageable);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", response);
    }
}
