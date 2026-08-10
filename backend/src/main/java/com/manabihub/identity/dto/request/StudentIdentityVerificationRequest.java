package com.manabihub.identity.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.Map;

public record StudentIdentityVerificationRequest(
        String providerSessionId,
        String providerTransactionId,
        @NotEmpty Map<String, Object> sdkResult
) {
}
