package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.wallet.dto.request.CreateTopUpRequest;
import com.manabihub.wallet.dto.response.StudentWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;
import com.manabihub.wallet.service.StudentWalletService;
import com.manabihub.wallet.service.WalletTopUpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * UC-17 "My Wallet" — student view and student-only actions.
 * <p>
 * The class-level {@code hasRole('STUDENT')} is the role gate required by UC-17: it exposes
 * only the student-facing sections (top-up/payment/refund) and never teacher-only fields such
 * as escrow or payout (BR-RBAC). It is also what blocks exception 4b — a student attempting a
 * withdrawal — since withdrawal lives behind {@code hasRole('TEACHER')} on
 * {@link TeacherWalletController} and has no student-side counterpart.
 */
@RestController
@RequestMapping("/api/v1/student/wallet")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentWalletController {

    private final StudentWalletService studentWalletService;
    private final WalletTopUpService walletTopUpService;

    @GetMapping
    public ApiResponse<StudentWalletSummaryResponse> getWallet() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Wallet loaded.",
                studentWalletService.getWalletSummary()
        );
    }

    @GetMapping("/transactions")
    public ApiResponse<List<WalletActivityResponse>> getTransactions() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Wallet transactions loaded.",
                studentWalletService.getWalletActivity()
        );
    }

    /**
     * Alternative flow 4a — creates a top-up payment request and returns the provider URL.
     * The balance is not touched here; it is credited only by the verified provider callback.
     */
    @PostMapping("/top-ups")
    public ApiResponse<WalletTopUpResponse> createTopUp(@Valid @RequestBody CreateTopUpRequest request,
                                                        HttpServletRequest httpRequest) {
        WalletTopUpResponse topUp = walletTopUpService.createTopUp(request, resolveClientIp(httpRequest));
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_002,
                "Yêu cầu nạp tiền đang chờ xác nhận từ cổng thanh toán.",
                topUp
        );
    }

    @GetMapping("/top-ups")
    public ApiResponse<List<WalletTopUpResponse>> getTopUps() {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Top-up history loaded.",
                walletTopUpService.getMyTopUps()
        );
    }

    /** Owner-scoped status lookup — the frontend polls this after the provider redirect. */
    @GetMapping("/top-ups/{topUpId}")
    public ApiResponse<WalletTopUpResponse> getTopUp(@PathVariable UUID topUpId) {
        return ApiResponse.success(
                MessageCodes.MSG_WALLET_001,
                "Top-up loaded.",
                walletTopUpService.getTopUpForCurrentStudent(topUpId)
        );
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
