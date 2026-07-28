package com.manabihub.refund.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.PageResponse;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.refund.dto.request.RefundDecisionRequest;
import com.manabihub.refund.dto.response.RefundDetailResponse;
import com.manabihub.refund.dto.response.RefundQueueResponse;
import com.manabihub.refund.entity.RefundRequest;
import com.manabihub.refund.enums.RefundStatus;
import com.manabihub.refund.mapper.RefundMapper;
import com.manabihub.refund.repository.RefundRequestRepository;
import com.manabihub.refund.service.RefundService;
import com.manabihub.wallet.service.EscrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundRequestRepository refundRequestRepository;
    private final RefundMapper refundMapper;
    private final CurrentUserService currentUserService;
    private final InternalAdminAccountRepository adminAccountRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EscrowService escrowService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RefundQueueResponse> getPendingRefunds(Pageable pageable) {
        Page<RefundRequest> page = refundRequestRepository.findByStatus(RefundStatus.PENDING, pageable);
        return PageResponse.from(page.map(refundMapper::toQueueResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public RefundDetailResponse getRefundDetail(UUID refundId) {
        RefundRequest request = refundRequestRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Refund request not found", HttpStatus.NOT_FOUND));
        return refundMapper.toDetailResponse(request);
    }

    @Override
    @Transactional
    public void approveRefund(UUID refundId, RefundDecisionRequest request) {
        InternalAdminAccount admin = getCurrentAdmin();

        RefundRequest refund = refundRequestRepository.findByIdForUpdate(refundId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Refund request not found", HttpStatus.NOT_FOUND));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BusinessException("MSG-COM-004", "Refund request is no longer pending", HttpStatus.BAD_REQUEST);
        }

        refund.setStatus(RefundStatus.APPROVED);
        refund.setDecisionNote(request.getNote());
        refund.setDecidedBy(admin);
        refund.setDecidedAt(Instant.now());
        refundRequestRepository.save(refund);

        Order order = refund.getOrder();
        order.setStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);

        List<OrderItem> items = orderItemRepository.findByOrder_Id(order.getId());
        for (OrderItem item : items) {
            enrollmentRepository.findByStudent_IdAndCourse_Id(refund.getStudent().getId(), item.getCourse().getId())
                    .ifPresent(e -> {
                        e.setStatus(EnrollmentStatus.REVOKED);
                        enrollmentRepository.save(e);
                    });
        }

        escrowService.reverseHeldAllocationsForRefund(order.getId());

        auditLogService.logAdminAction(
                admin.getId(),
                "FINANCE_MANAGER",
                "APPROVE_REFUND",
                "REFUND_REQUEST",
                refund.getId(),
                Map.of("status", "PENDING"),
                Map.of("status", "APPROVED", "note", request.getNote()),
                Map.of()
        );

        notificationService.createNotification(
                refund.getStudent().getUser().getId(),
                refund.getStudent().getUser().getEmail(),
                "Yêu cầu hoàn tiền được chấp thuận",
                "Yêu cầu hoàn tiền đã được chấp thuận.",
                "REFUND"
        );
    }

    @Override
    @Transactional
    public void rejectRefund(UUID refundId, RefundDecisionRequest request) {
        InternalAdminAccount admin = getCurrentAdmin();

        RefundRequest refund = refundRequestRepository.findByIdForUpdate(refundId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Refund request not found", HttpStatus.NOT_FOUND));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BusinessException("MSG-COM-004", "Refund request is no longer pending", HttpStatus.BAD_REQUEST);
        }

        refund.setStatus(RefundStatus.REJECTED);
        refund.setDecisionNote(request.getNote());
        refund.setDecidedBy(admin);
        refund.setDecidedAt(Instant.now());
        refundRequestRepository.save(refund);

        auditLogService.logAdminAction(
                admin.getId(),
                "FINANCE_MANAGER",
                "REJECT_REFUND",
                "REFUND_REQUEST",
                refund.getId(),
                Map.of("status", "PENDING"),
                Map.of("status", "REJECTED", "note", request.getNote()),
                Map.of()
        );

        notificationService.createNotification(
                refund.getStudent().getUser().getId(),
                refund.getStudent().getUser().getEmail(),
                "Yêu cầu hoàn tiền bị từ chối",
                "Yêu cầu hoàn tiền đã bị từ chối hoặc bạn đã tải toàn bộ tài liệu được bảo vệ.",
                "REFUND"
        );
    }

    private InternalAdminAccount getCurrentAdmin() {
        UUID userId = currentUserService.getCurrentUserId();
        return adminAccountRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Admin not found", HttpStatus.UNAUTHORIZED));
    }
}
