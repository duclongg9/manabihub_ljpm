package com.manabihub.systemconfig.dto;

import java.math.BigDecimal;

public record CommercialPolicyDto(
        String currency,
        BigDecimal commissionRate,
        Integer refundWindowDays,
        Integer refundProgressLimitPercent,
        Integer escrowHoldingDays,
        BigDecimal payoutThreshold,
        BigDecimal withdrawalFee,
        Integer kycTargetDaysMin,
        Integer kycTargetDaysMax,
        String version,
        String effectiveDate
) {
}
