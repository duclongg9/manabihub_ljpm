package com.manabihub.refund.dto.response;

import com.manabihub.refund.enums.RefundStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class RefundDetailResponse {
    private UUID id;
    private UUID orderId;
    private String orderCode;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private RefundStatus status;
    private String reason;
    private Map<String, Object> eligibilitySnapshot;
    private UUID decidedBy;
    private String decisionNote;
    private Instant decidedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
