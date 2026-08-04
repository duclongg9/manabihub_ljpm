package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teacher/wallet")
@RequiredArgsConstructor
@Tag(name = "Teacher Wallet", description = "Teacher Revenue Wallet Operations")
public class TeacherWalletController {

    private final WalletService walletService;
    private final EscrowService escrowService;

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get teacher wallet details")
    public ApiResponse<TeacherWalletResponse> getWallet(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        TeacherWalletResponse response = walletService.getTeacherWalletByUserId(userId);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", response);
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
