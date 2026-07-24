package com.manabihub.payout.service.impl;

import com.manabihub.payout.service.PayoutGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class MockPayoutGateway implements PayoutGateway {

    @Override
    public PayoutGatewayResult transfer(PayoutGatewayCommand command) {
        log.info("Mocking payout transfer for settlementId: {}", command.getSettlementId());
        
        try {
            // Simulate network delay
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simulate 80% success rate
        boolean isSuccess = ThreadLocalRandom.current().nextInt(100) < 80;

        if (isSuccess) {
            String mockRef = "GW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            log.info("Mock payout success. Ref: {}", mockRef);
            return PayoutGatewayResult.builder()
                    .success(true)
                    .providerReference(mockRef)
                    .build();
        } else {
            log.warn("Mock payout failed");
            return PayoutGatewayResult.builder()
                    .success(false)
                    .errorCode("ERR_BANK_TIMEOUT")
                    .errorMessage("Connection to destination bank timed out")
                    .isRetryable(true)
                    .build();
        }
    }

    @Override
    public PayoutGatewayResult getTransferStatus(String providerReference) {
        return PayoutGatewayResult.builder()
                .success(true)
                .providerReference(providerReference)
                .build();
    }
}
