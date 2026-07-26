package com.manabihub.payout.dto.response;

import com.manabihub.payout.enums.PayoutStatus;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class PayoutQueueItemResponse {
    UUID withdrawalRequestId;
    UUID teacherId;
    String teacherName;
    BigDecimal requestedAmount;
    WithdrawalStatus status;
    PayoutStatus settlementStatus;
    ReconciliationStatus reconciliationStatus;
    LocalDateTime requestedAt;
    Instant processingStartedAt;
    int retryCount;
}
