package com.manabihub.payout.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
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

    @Valid
    private BankAccountDto bankAccount;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    @Builder.Default
    private boolean saveAccount = false;

    /**
     * Temporary local/test acknowledgement used until the real identity and
     * bank-account ownership provider is integrated. It is never trusted by
     * non-local verification implementations.
     */
    @Builder.Default
    private boolean ownershipConfirmed = false;

    @AssertTrue(message = "Provide exactly one of bankAccountId or bankAccount")
    public boolean isBankAccountSelectionValid() {
        boolean hasSavedAccount = bankAccountId != null && !bankAccountId.isBlank();
        boolean hasNewAccount = bankAccount != null;
        return hasSavedAccount != hasNewAccount;
    }
}
