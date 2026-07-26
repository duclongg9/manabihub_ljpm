package com.manabihub.order.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID courseId,
        String courseTitle,
        String courseThumbnailUrl,
        BigDecimal price
) {
}
