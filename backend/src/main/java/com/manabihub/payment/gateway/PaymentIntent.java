package com.manabihub.payment.gateway;

import java.math.BigDecimal;

/**
 * Provider-neutral description of one thing we want the user to pay for.
 * <p>
 * Decouples {@link PaymentGateway} from what is being paid: a course {@code Order} (UC-08)
 * and a wallet top-up (UC-17) both collapse to a reference, an amount and a return URL.
 *
 * @param reference   our own reference sent to the provider (VNPay {@code vnp_TxnRef}); must be
 *                    unique and is what the callback is matched back on
 * @param amount      amount in major units (VND); the gateway converts to minor units
 * @param description human-readable description shown on the provider's page
 * @param returnUrl   where the provider redirects the browser afterwards
 */
public record PaymentIntent(
        String reference,
        BigDecimal amount,
        String description,
        String returnUrl
) {

    /** Appends a query parameter to a URL that may or may not already carry a query string. */
    public static String withQuery(String baseUrl, String queryParam) {
        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl + separator + queryParam;
    }
}
