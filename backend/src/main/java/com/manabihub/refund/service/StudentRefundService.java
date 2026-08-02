package com.manabihub.refund.service;

import com.manabihub.common.response.PageResponse;
import com.manabihub.refund.dto.request.CreateStudentRefundRequest;
import com.manabihub.refund.dto.response.RefundDetailResponse;
import com.manabihub.refund.dto.response.RefundQueueResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StudentRefundService {
    RefundDetailResponse createRefundRequest(UUID userId, CreateStudentRefundRequest request);
    PageResponse<RefundQueueResponse> getMyRefundRequests(UUID userId, Pageable pageable);
    RefundDetailResponse getMyRefundDetail(UUID userId, UUID refundId);
    void cancelRefundRequest(UUID userId, UUID refundId);
}
