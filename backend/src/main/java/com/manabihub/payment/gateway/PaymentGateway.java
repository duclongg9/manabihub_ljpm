package com.manabihub.payment.gateway;

import com.manabihub.order.entity.Order;

import java.util.Map;

/**
 * Abstraction over a payment provider so the purchase flow (UC-08) and the wallet top-up
 * flow (UC-17) do not depend on VNPay specifics. Swapping providers means providing
 * another implementation of this interface.
 */
public interface PaymentGateway {

    /** Provider identifier stored on {@code PaymentTransaction.provider}, e.g. {@code VNPAY}. */
    String getProvider();

    /** Builds the provider payment URL the browser must be redirected to for the given intent. */
    String buildPaymentUrl(PaymentIntent intent, String clientIp);

    /** Builds the provider payment URL the browser must be redirected to for the given order. */
    String buildPaymentUrl(Order order, String clientIp);

    /** Verifies the checksum and extracts the normalised result from a provider callback. */
    PaymentCallbackResult parseCallback(Map<String, String> params);

    /**
     * Builds a fully-signed callback parameter map that is byte-for-byte verifiable by
     * {@link #parseCallback(Map)}. Used only by the local dev simulator to exercise the
     * real webhook path without a public tunnel to the provider.
     */
    Map<String, String> buildSignedCallbackParams(PaymentIntent intent, boolean success);

    /** Order-flavoured overload of {@link #buildSignedCallbackParams(PaymentIntent, boolean)}. */
    Map<String, String> buildSignedCallbackParams(Order order, boolean success);
}
