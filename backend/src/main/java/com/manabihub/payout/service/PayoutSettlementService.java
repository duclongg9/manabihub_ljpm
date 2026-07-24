package com.manabihub.payout.service;

import com.manabihub.payout.dto.request.ManualTransferRequest;
import com.manabihub.payout.dto.request.RejectPayoutRequest;
import com.manabihub.payout.dto.response.PayoutDetailResponse;
import com.manabihub.payout.dto.response.PayoutQueueItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PayoutSettlementService {

    Page<PayoutQueueItemResponse> getPayoutQueue(Pageable pageable);

    PayoutDetailResponse getPayoutDetail(UUID withdrawalRequestId);

    void approvePayout(UUID withdrawalRequestId);

    void rejectPayout(UUID withdrawalRequestId, RejectPayoutRequest request);

    void confirmManualTransfer(UUID withdrawalRequestId, ManualTransferRequest request);
}
