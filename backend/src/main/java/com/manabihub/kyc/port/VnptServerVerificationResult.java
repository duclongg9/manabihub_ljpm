package com.manabihub.kyc.port;

import java.util.List;

/**
 * Result of a VNPT server-to-server verification call.
 */
public record VnptServerVerificationResult(
        boolean verified,
        String transactionId,
        String providerStatus,
        String reasonCode,
        String verifiedAt,
        String serverIdNumber,
        String maskedReference,
        List<String> failureReasons
) {
    public static VnptServerVerificationResult success(
            String transactionId,
            String providerStatus,
            String verifiedAt,
            String serverIdNumber,
            String maskedReference
    ) {
        return new VnptServerVerificationResult(
                true, transactionId, providerStatus, null, verifiedAt, serverIdNumber, maskedReference, List.of()
        );
    }

    public static VnptServerVerificationResult failure(
            String transactionId,
            String providerStatus,
            String reasonCode,
            List<String> reasons
    ) {
        return new VnptServerVerificationResult(
                false, transactionId, providerStatus, reasonCode, null, null, null, reasons
        );
    }
}
