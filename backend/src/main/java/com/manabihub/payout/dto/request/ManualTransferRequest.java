package com.manabihub.payout.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ManualTransferRequest {

    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    @NotNull(message = "Transferred amount is required")
    @Positive(message = "Transferred amount must be greater than zero")
    private BigDecimal transferredAmount;

    @NotNull(message = "Transferred timestamp is required")
    private Instant transferredAt;

    private String proofFileId;

    private String note;
}
