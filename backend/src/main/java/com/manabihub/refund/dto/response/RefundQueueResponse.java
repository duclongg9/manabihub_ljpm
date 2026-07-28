package com.manabihub.refund.dto.response;

import com.manabihub.refund.enums.RefundStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RefundQueueResponse {
    private UUID id;
    private UUID orderId;
    private String orderCode;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String reason;
    private RefundStatus status;
    private Instant createdAt;
}
