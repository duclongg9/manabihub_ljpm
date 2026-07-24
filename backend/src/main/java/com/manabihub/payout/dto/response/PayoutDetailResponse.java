package com.manabihub.payout.dto.response;

import com.manabihub.payout.enums.PayoutStatus;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class PayoutDetailResponse {
    private UUID withdrawalRequestId;
    private UUID settlementId;
    private UUID teacherId;
    private String teacherName;
    private BigDecimal requestedAmount;
    private BigDecimal availableBalance;
    private BigDecimal reservedBalance;
    private boolean walletFrozen;
    private WithdrawalStatus status;
    private ReconciliationStatus reconciliationStatus;
    private List<String> reconciliationAlerts;
    
    // Bank info
    private String bankName;
    private String bankBranch;
    private String accountHolderName;
    private String accountNumberMasked;
    
    // Settlement info
    private PayoutStatus settlementStatus;
    private Instant requestedAt;
    private Instant settledAt;
    private String decisionReason;
    private String gatewayReference;
}
