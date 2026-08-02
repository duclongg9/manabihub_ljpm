package com.manabihub.kyc.port;

import java.util.List;
import java.util.Map;

/**
 * Result of a VNPT server-to-server verification call.
 *
 * @param verified       true if the VNPT server confirmed the transaction
 * @param transactionId  the transaction ID as confirmed by VNPT server
 * @param serverPayload  raw server response for audit logging (never exposed to client)
 * @param failureReasons human-readable reasons if verification failed
 */
public record VnptServerVerificationResult(
        boolean verified,
        String transactionId,
        Map<String, Object> serverPayload,
        List<String> failureReasons
) {
    public static VnptServerVerificationResult success(String transactionId, Map<String, Object> payload) {
        return new VnptServerVerificationResult(true, transactionId, payload, List.of());
    }

    public static VnptServerVerificationResult failure(String transactionId, List<String> reasons) {
        return new VnptServerVerificationResult(false, transactionId, Map.of(), reasons);
    }
}
