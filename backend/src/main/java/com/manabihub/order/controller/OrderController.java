package com.manabihub.order.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.PageResponse;
import com.manabihub.order.dto.request.CreateOrderRequest;
import com.manabihub.order.dto.response.CheckoutResponse;
import com.manabihub.order.dto.response.OrderResponse;
import com.manabihub.order.entity.Order;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.service.OrderService;
import com.manabihub.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Student-facing purchase endpoints (UC-08): create an order and check its status.
 */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    /**
     * Creates a PENDING order for a course and initiates payment, returning the provider
     * payment URL the browser must be redirected to.
     */
    @PostMapping
    public ApiResponse<CheckoutResponse> checkout(@Valid @RequestBody CreateOrderRequest request,
                                                  HttpServletRequest httpRequest) {
        Order order = orderService.createOrder(request.courseId());

        // Free course: enroll immediately, skip the payment provider entirely
        // (paymentUrl is null so the frontend goes straight to the course).
        if (order.getTotalAmount().signum() == 0) {
            orderService.enrollFreeOrder(order);
            CheckoutResponse freeCheckout = new CheckoutResponse(
                    order.getId(),
                    order.getOrderCode(),
                    order.getTotalAmount(),
                    order.getCurrency(),
                    order.getStatus().name(),
                    null);
            // MSG-PAY-002: product unlocked immediately (no payment needed).
            return ApiResponse.success(MessageCodes.MSG_PAY_002, "Đã ghi danh khoá học miễn phí.", freeCheckout);
        }

        String paymentUrl = paymentService.initiatePayment(order, resolveClientIp(httpRequest));
        CheckoutResponse checkout = new CheckoutResponse(
                order.getId(),
                order.getOrderCode(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus().name(),
                paymentUrl);

        // MSG-PAY-001: order is now Pending Payment, awaiting gateway confirmation.
        return ApiResponse.success(MessageCodes.MSG_PAY_001, "Thanh toán đang được xử lý. Vui lòng chờ xác nhận.", checkout);
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable UUID orderId) {
        return ApiResponse.success(
                MessageCodes.ORDER_RETRIEVED,
                "Order retrieved successfully.",
                orderService.getOrderForCurrentStudent(orderId));
    }

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ApiResponse.success(
                MessageCodes.ORDER_RETRIEVED,
                "Purchase history retrieved successfully.",
                orderService.getOrdersForCurrentStudent(status, pageable));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
