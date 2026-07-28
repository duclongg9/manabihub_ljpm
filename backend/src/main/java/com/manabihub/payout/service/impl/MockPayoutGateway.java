package com.manabihub.payout.service.impl;

import com.manabihub.payout.service.PayoutGateway;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@Profile({"local", "test"})
public class MockPayoutGateway implements PayoutGateway {

    private final ConcurrentMap<String, PayoutGatewayResult> resultsByIdempotencyKey =
            new ConcurrentHashMap<>();

    @Override
    public String providerName() {
        return "MOCK_PAYOUT";
    }

    @Override
    public PayoutGatewayResult transfer(PayoutGatewayCommand command) {
        return resultsByIdempotencyKey.computeIfAbsent(
                command.getIdempotencyKey(),
                key -> PayoutGatewayResult.builder()
                        .success(true)
                        .providerReference(referenceFor(key))
                        .build()
        );
    }

    @Override
    public PayoutGatewayResult getTransferStatus(String providerReference) {
        return resultsByIdempotencyKey.values().stream()
                .filter(result -> providerReference.equals(result.getProviderReference()))
                .findFirst()
                .orElseGet(() -> PayoutGatewayResult.builder()
                        .success(false)
                        .errorCode("PAYOUT_REFERENCE_NOT_FOUND")
                        .errorMessage("The payout provider reference was not found.")
                        .isRetryable(false)
                        .build());
    }

    private String referenceFor(String idempotencyKey) {
        UUID stableId = UUID.nameUUIDFromBytes(idempotencyKey.getBytes(StandardCharsets.UTF_8));
        return "MOCK-" + stableId.toString().substring(0, 12).toUpperCase();
    }
}
