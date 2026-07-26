package com.manabihub.order.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to create a purchase order for a single published course (UC-08).
 */
public record CreateOrderRequest(
        @NotNull(message = "courseId is required")
        UUID courseId
) {
}
