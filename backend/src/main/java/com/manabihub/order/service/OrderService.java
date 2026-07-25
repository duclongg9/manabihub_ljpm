package com.manabihub.order.service;

import com.manabihub.order.dto.response.OrderResponse;
import com.manabihub.order.entity.Order;

import java.util.UUID;

public interface OrderService {

    /**
     * Creates a PENDING order (with one order item) for the given published course,
     * on behalf of the currently authenticated student.
     *
     * @throws com.manabihub.common.exception.BusinessException if the course is not
     *         published or the student already owns it
     */
    Order createOrder(UUID courseId);

    /**
     * Returns an order owned by the current student, used by the frontend to poll
     * payment status after redirecting back from the payment provider.
     */
    OrderResponse getOrderForCurrentStudent(UUID orderId);
}
