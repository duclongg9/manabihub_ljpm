package com.manabihub.kyc.port;

import java.time.Instant;
import java.util.List;

/**
 * Result of a VNPT server-to-server verification call.
 */
public record VnptServerVerificationResult(
        String confirmedTransactionId,
        String confirmedSessionId,
        boolean verified,
        String providerStatus,
        Instant providerVerifiedAt,
        String reasonCode,
        List<String> failureReasons,
        String serverIdNumber,
        String maskedReference
) {
    public static VnptServerVerificationResult success(
            String txId,
            String sessionId,
            String providerStatus,
            Instant verifiedAt,
            String idNumber,
            String maskedReference
    ) {
        return new VnptServerVerificationResult(
                txId, sessionId, true, providerStatus, verifiedAt,
                null, List.of(), idNumber, maskedReference
        );
    }

    public static VnptServerVerificationResult failure(
            String txId,
            String sessionId,
            String providerStatus,
            String reasonCode,
            List<String> reasons
    ) {
        return new VnptServerVerificationResult(
                txId, sessionId, false, providerStatus, null,
                reasonCode, reasons, null, null
        );
    }
}
