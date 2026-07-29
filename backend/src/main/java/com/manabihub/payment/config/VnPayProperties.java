package com.manabihub.payment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * VNPay (sandbox) integration settings.
 * <p>
 * Secret values ({@code tmnCode}, {@code hashSecret}) must be supplied through
 * {@code application-secrets.yml} or environment variables — never committed.
 */
@Component
@ConfigurationProperties(prefix = "manabihub.payment.vnpay")
@Getter
@Setter
public class VnPayProperties {

    /** Merchant terminal id issued by VNPay. */
    private String tmnCode = "";

    /** Secret used to build/verify the HMAC-SHA512 checksum. */
    private String hashSecret = "";

    /** VNPay payment page URL. */
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /** VNPay merchant web API (query/refund) — reserved for later use cases. */
    private String apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    /** Where VNPay redirects the browser after payment (a frontend page that polls order status). */
    private String returnUrl = "http://localhost:5173/checkout/return";

    /**
     * Where VNPay redirects the browser after a wallet top-up (UC-17) — a frontend page that
     * polls the top-up status. Separate from {@link #returnUrl} because a top-up has no order
     * and lands back inside the student's wallet, not the course player.
     */
    private String walletReturnUrl = "http://localhost:5173/student/wallet/top-up/return";

    private String version = "2.1.0";
    private String command = "pay";
    private String orderType = "other";
    private String locale = "vn";
    private String currency = "VND";

    /** Enables the local dev endpoint that simulates a VNPay IPN callback without a tunnel. */
    private boolean devSimulatorEnabled = true;
}
