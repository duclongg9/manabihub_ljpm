package com.manabihub.payout.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWithdrawalRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String bankAccountId;

    @NotNull(message = "Bank account object is required")
    @Valid
    private BankAccountDto bankAccount;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    @Builder.Default
    private boolean saveAccount = false;
}
