package com.manabihub.wallet.dto.response;

import com.manabihub.wallet.enums.PayoutSettlementStatus;
import com.manabihub.wallet.enums.WithdrawalRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * One row of the Teacher withdrawal history, including its payout status.
 *
 * @param id                  withdrawal request id
 * @param amount              requested amount
 * @param status              withdrawal decision status
 * @param requestedAt         when the teacher submitted the request
 * @param decidedAt           when an admin decided, null while pending
 * @param decisionNote        admin note, null while pending
 * @param payoutStatus        settlement status, null when not settled yet
 * @param payoutReference     gateway/bank reference of the settlement
 * @param payoutExecutedAt    when the transfer was executed
 */
public record WithdrawalRequestResponse(
        UUID id,
        BigDecimal amount,
        WithdrawalRequestStatus status,
        Instant requestedAt,
        Instant decidedAt,
        String decisionNote,
        PayoutSettlementStatus payoutStatus,
        String payoutReference,
        Instant payoutExecutedAt
) {
}
