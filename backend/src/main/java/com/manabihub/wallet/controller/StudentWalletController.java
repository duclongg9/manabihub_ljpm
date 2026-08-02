package com.manabihub.wallet.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.order.dto.response.CheckoutResponse;
import com.manabihub.order.entity.Order;
import com.manabihub.order.service.OrderService;
import com.manabihub.payment.service.PaymentService;
import com.manabihub.wallet.dto.request.TopUpRequest;
import com.manabihub.wallet.dto.response.StudentWalletResponse;
import com.manabihub.wallet.service.StudentWalletService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Student money-wallet endpoints (MHB-37): view balance and initiate a wallet top-up.
 * <p>
 * Top-up is confirmed only by the payment provider's server-to-server IPN (see
 * {@code PaymentController}); this endpoint just creates the top-up order and returns the
 * payment URL — it never trusts a client-side payment result (SRS NFR-SEC-14).
 */
@RestController
@RequestMapping("/api/v1/student/wallet")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentWalletController {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final StudentWalletService studentWalletService;

    @GetMapping
    public ApiResponse<StudentWalletResponse> getWallet(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Wallet retrieved successfully.",
                studentWalletService.getWalletOverview(userId));
    }

    @PostMapping("/top-up")
    public ApiResponse<CheckoutResponse> topUp(@Valid @RequestBody TopUpRequest request,
                                               HttpServletRequest httpRequest) {
        Order order = orderService.createTopUpOrder(request.amount());
        String paymentUrl = paymentService.initiatePayment(order, resolveClientIp(httpRequest));

        CheckoutResponse checkout = new CheckoutResponse(
                order.getId(),
                order.getOrderCode(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus().name(),
                paymentUrl);

        // MSG-PAY-001: order is now Pending Payment, awaiting gateway confirmation.
        return ApiResponse.success(MessageCodes.MSG_PAY_001,
                "Thanh toán đang được xử lý. Vui lòng chờ xác nhận.", checkout);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
