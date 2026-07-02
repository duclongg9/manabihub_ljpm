package com.manabihub.kyc.dto;

import java.util.Map;

public record KycIdentityVerificationRequest(
        String providerSessionId,
        String providerTransactionId,
        Map<String, Object> sdkResult
) {
}
