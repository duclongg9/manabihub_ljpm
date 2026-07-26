package com.manabihub.payment.service;

import com.manabihub.order.entity.Order;
import com.manabihub.payment.dto.IpnAckResponse;

import java.util.Map;

public interface PaymentService {

    /**
     * Records a PENDING payment transaction for the order and returns the provider
     * payment URL the browser should be redirected to.
     */
    String initiatePayment(Order order, String clientIp);

    /**
     * Processes a provider webhook (VNPay IPN). This is the ONLY path that confirms a
     * payment. It verifies the checksum, and on a valid successful callback creates the
     * enrollment, marks the payment/order paid, holds funds in escrow, and notifies the
     * student — all in one transaction. Idempotent: a replayed callback for an
     * already-paid order is a no-op.
     *
     * @return the acknowledgement to send back to the provider
     */
    IpnAckResponse handleIpn(Map<String, String> params);
}
