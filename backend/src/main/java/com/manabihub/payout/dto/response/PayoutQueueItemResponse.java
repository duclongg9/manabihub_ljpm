package com.manabihub.payout.dto.response;

import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class PayoutQueueItemResponse {
    private UUID withdrawalRequestId;
    private UUID teacherId;
    private String teacherName;
    private BigDecimal requestedAmount;
    private WithdrawalStatus status;
    private ReconciliationStatus reconciliationStatus;
    private Instant requestedAt;
}
