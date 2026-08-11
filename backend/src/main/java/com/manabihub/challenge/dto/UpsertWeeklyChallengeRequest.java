package com.manabihub.challenge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpsertWeeklyChallengeRequest(
        @NotNull LocalDate weekStart,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotBlank @Pattern(regexp = "N[1-5]") String jlptLevel,
        @Min(1) @Max(10) int dailyRankedLimit,
        @Min(0) @Max(30) int wrongPenaltySeconds,
        @NotNull @DecimalMin("0") @DecimalMax("10000") BigDecimal dailyAttendanceReward,
        @NotNull @DecimalMin("0") @DecimalMax("500000") BigDecimal firstPrize,
        @NotNull @DecimalMin("0") @DecimalMax("500000") BigDecimal secondPrize,
        @NotNull @DecimalMin("0") @DecimalMax("500000") BigDecimal thirdPrize,
        @NotNull @Size(min = 4, max = 12) List<@Valid ChallengePairRequest> pairs
) {}
