package com.manabihub.payment.controller;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.order.entity.Order;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.payment.config.VnPayProperties;
import com.manabihub.payment.dto.IpnAckResponse;
import com.manabihub.payment.gateway.PaymentGateway;
import com.manabihub.payment.service.PaymentService;
import com.manabihub.wallet.service.WalletTopUpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Payment provider callbacks (UC-08 course purchase, UC-17 wallet top-up). These endpoints
 * are public — they are called by VNPay (or the local dev simulator), not by an authenticated
 * browser session — and are secured by the VNPay HMAC checksum instead of a JWT.
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private static final String TXN_REF_PARAM = "vnp_TxnRef";

    private final PaymentService paymentService;
    private final WalletTopUpService walletTopUpService;
    private final PaymentGateway paymentGateway;
    private final OrderRepository orderRepository;
    private final VnPayProperties vnPayProperties;

    /**
     * VNPay IPN (Instant Payment Notification) — the authoritative, server-to-server
     * payment confirmation. Returns the acknowledgement VNPay expects.
     */
    @GetMapping("/vnpay/ipn")
    public IpnAckResponse handleVnPayIpn(@RequestParam Map<String, String> params) {
        return dispatch(params);
    }

    /**
     * Confirms a payment from the browser return redirect. VNPay redirects the browser to the
     * frontend return page carrying the (signed) {@code vnp_*} result params; the frontend
     * forwards them here so the order or top-up can be confirmed immediately without waiting
     * for the server-to-server IPN — useful on localhost where VNPay cannot reach the backend.
     * <p>
     * Security is unchanged: this runs the exact same checksum-verified, idempotent logic, so a
     * tampered redirect fails verification and the authoritative IPN remains the source of
     * truth in production.
     */
    @GetMapping("/vnpay/confirm-return")
    public IpnAckResponse confirmFromReturn(@RequestParam Map<String, String> params) {
        return dispatch(params);
    }

    /**
     * Local dev simulator: builds a correctly-signed IPN payload for an order and runs it
     * through the exact same {@link PaymentService#handleIpn} path VNPay would trigger, so
     * the flow can be tested end-to-end without exposing localhost to VNPay via a tunnel.
     * Disabled when {@code manabihub.payment.vnpay.dev-simulator-enabled=false}.
     */
    @PostMapping("/dev/ipn")
    public IpnAckResponse simulateIpn(@RequestParam String orderCode,
                                      @RequestParam(defaultValue = "true") boolean success) {
        requireDevSimulator();

        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.ORDER_NOT_FOUND,
                        "Order was not found",
                        HttpStatus.NOT_FOUND));

        log.info("Simulating VNPay IPN for order {} (success={})", orderCode, success);
        Map<String, String> signedParams = paymentGateway.buildSignedCallbackParams(order, success);
        return paymentService.handleIpn(signedParams);
    }

    /** Local dev simulator for the UC-17 wallet top-up callback. */
    @PostMapping("/dev/wallet-topup-ipn")
    public IpnAckResponse simulateWalletTopUpIpn(@RequestParam String topUpCode,
                                                 @RequestParam(defaultValue = "true") boolean success) {
        requireDevSimulator();
        return walletTopUpService.simulateCallback(topUpCode, success);
    }

    /**
     * VNPay posts every callback to a single merchant-level URL, so the reference itself has
     * to say what was paid for. Wallet top-ups carry a {@code TU} prefix on {@code vnp_TxnRef};
     * everything else is an order.
     */
    private IpnAckResponse dispatch(Map<String, String> params) {
        String reference = params.get(TXN_REF_PARAM);
        if (reference != null && reference.startsWith(WalletTopUpService.CODE_PREFIX)) {
            return walletTopUpService.handleCallback(params);
        }
        return paymentService.handleIpn(params);
    }

    private void requireDevSimulator() {
        if (!vnPayProperties.isDevSimulatorEnabled()) {
            throw new BusinessException(
                    MessageCodes.AUTH_FORBIDDEN,
                    "Payment dev simulator is disabled",
                    HttpStatus.FORBIDDEN);
        }
    }
}
