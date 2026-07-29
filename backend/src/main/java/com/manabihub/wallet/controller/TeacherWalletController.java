package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.service.TeacherWalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
@PreAuthorize("hasRole('TEACHER')")
public class TeacherWalletController {

    private final TeacherWalletService teacherWalletService;

    @GetMapping
    public ApiResponse<TeacherWalletSummaryResponse> getWallet() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Wallet loaded.",
                teacherWalletService.getWalletSummary()
        );
    }

    @GetMapping("/escrow")
    public ApiResponse<List<EscrowEntryResponse>> getPendingEscrow() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Pending escrow loaded.",
                teacherWalletService.getPendingEscrow()
        );
    }

    @GetMapping("/transactions")
    public ApiResponse<List<WalletActivityResponse>> getWithdrawalHistory() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Withdrawal history loaded.",
                teacherWalletService.getWithdrawalHistory()
        );
    }
}
