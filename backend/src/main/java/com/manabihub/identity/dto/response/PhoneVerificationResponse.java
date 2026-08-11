package com.manabihub.identity.dto.response;

import java.time.Instant;

public record PhoneVerificationResponse(
        String phoneNumber,
        boolean verified,
        Instant verifiedAt
) {
}
