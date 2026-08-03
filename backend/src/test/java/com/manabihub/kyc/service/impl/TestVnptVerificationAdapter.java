package com.manabihub.kyc.service.impl;

import com.manabihub.kyc.port.VnptVerificationPort;
import com.manabihub.kyc.port.VnptServerVerificationResult;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Primary
@Profile("test")
public class TestVnptVerificationAdapter implements VnptVerificationPort {

    private static final Map<String, String> allowedTxIds = new ConcurrentHashMap<>();

    public static void allowTransaction(String txId, String serverIdNumber) {
        allowedTxIds.put(txId, serverIdNumber);
    }

    public static void clear() {
        allowedTxIds.clear();
    }
    
    @Override
    public VnptServerVerificationResult verifyTransaction(String providerTransactionId, String providerSessionId) {
        if (providerTransactionId != null && allowedTxIds.containsKey(providerTransactionId)) {
            return VnptServerVerificationResult.success(
                    providerTransactionId,
                    "SUCCESS",
                    Instant.now().toString(),
                    allowedTxIds.get(providerTransactionId),
                    "ref-" + providerTransactionId
            );
        }
        return VnptServerVerificationResult.failure(
                providerTransactionId,
                "NOT_FOUND",
                "TX_NOT_FOUND",
                List.of("Transaction ID is not in the allowed test list.")
        );
    }
}
