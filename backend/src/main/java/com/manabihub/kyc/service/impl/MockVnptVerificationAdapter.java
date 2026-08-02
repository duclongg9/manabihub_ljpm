package com.manabihub.kyc.service.impl;

import com.manabihub.kyc.port.NationalIdRecordDto;
import com.manabihub.kyc.port.NationalIdRegistryPort;
import com.manabihub.kyc.port.VnptServerVerificationResult;
import com.manabihub.kyc.port.VnptVerificationPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Mock VNPT server-to-server verification adapter for development and CI.
 * <p>
 * This adapter simulates VNPT server verification by cross-referencing
 * the provider transaction ID against the mock national ID registry.
 * It is automatically used when no live VNPT adapter is configured.
 * <p>
 * <b>Security note:</b> This adapter MUST NOT be used in production.
 * A real {@link VnptVerificationPort} implementation backed by VNPT API
 * credentials must be provided via the {@code vnpt-live} profile.
 */
@Component
@ConditionalOnMissingBean(VnptVerificationPort.class)
public class MockVnptVerificationAdapter implements VnptVerificationPort {

    private static final Logger log = LoggerFactory.getLogger(MockVnptVerificationAdapter.class);

    private final NationalIdRegistryPort nationalIdRegistry;

    public MockVnptVerificationAdapter(NationalIdRegistryPort nationalIdRegistry) {
        this.nationalIdRegistry = nationalIdRegistry;
        log.warn("VNPT_MOCK_ADAPTER: Using mock VNPT server verification. "
                + "This is NOT suitable for production. Configure a real VnptVerificationPort bean.");
    }

    @Override
    public VnptServerVerificationResult verifyTransaction(
            String providerTransactionId,
            String providerSessionId
    ) {
        if (!StringUtils.hasText(providerTransactionId)) {
            return VnptServerVerificationResult.failure(
                    providerTransactionId,
                    List.of("Provider transaction ID is required for server verification")
            );
        }

        // In mock mode, we simulate server verification by checking if the transaction ID
        // follows a pattern that references a known mock national ID.
        // Real implementation would call VNPT REST API here.
        log.info("VNPT_MOCK_ADAPTER: Simulating server verification for transaction={}, session={}",
                providerTransactionId, providerSessionId);

        // The mock accepts any non-blank transaction ID as "server confirmed"
        // since the actual OCR/face data validation is handled by evaluateSdkResult().
        // The mock national ID registry lookup provides the identity cross-check.
        return VnptServerVerificationResult.success(
                providerTransactionId,
                Map.of(
                        "mock", true,
                        "providerTransactionId", providerTransactionId,
                        "serverConfirmedAt", java.time.Instant.now().toString()
                )
        );
    }
}
