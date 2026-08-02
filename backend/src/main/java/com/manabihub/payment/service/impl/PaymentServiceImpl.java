package com.manabihub.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.enums.OrderType;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.payment.dto.IpnAckResponse;
import com.manabihub.payment.entity.PaymentTransaction;
import com.manabihub.payment.enums.PaymentStatus;
import com.manabihub.payment.gateway.PaymentCallbackResult;
import com.manabihub.payment.gateway.PaymentGateway;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.payment.service.PaymentService;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.StudentWalletService;
import com.manabihub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private static final BigDecimal MINOR_UNIT_FACTOR = BigDecimal.valueOf(100);
    private static final String NOTIFICATION_TYPE = "PURCHASE_SUCCESS";

    private final PaymentGateway paymentGateway;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EscrowService escrowService;
    private final StudentWalletService studentWalletService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public String initiatePayment(Order order, String clientIp) {
        paymentTransactionRepository.save(PaymentTransaction.builder()
                .order(order)
                .provider(paymentGateway.getProvider())
                .amount(order.getGatewayAmount())
                .status(PaymentStatus.PENDING)
                .build());

        return paymentGateway.buildPaymentUrl(order, clientIp);
    }

    @Override
    @Transactional
    public IpnAckResponse handleIpn(Map<String, String> params) {
        PaymentCallbackResult result = paymentGateway.parseCallback(params);
        if (!result.signatureValid()) {
            log.warn("[{}] Rejected payment IPN with invalid checksum, txnRef={}",
                    MessageCodes.MSG_PAY_004, result.orderCode());
            return IpnAckResponse.of("97", "Invalid Checksum");
        }

        // Pessimistic lock serializes concurrent IPN callbacks for the same order,
        // which — together with the PAID status check below — makes processing idempotent.
        Order order = orderRepository.findByOrderCodeForUpdate(result.orderCode()).orElse(null);
        if (order == null) {
            return IpnAckResponse.of("01", "Order not Found");
        }

        long expectedMinor = order.getGatewayAmount().multiply(MINOR_UNIT_FACTOR).longValue();
        if (result.amount() != expectedMinor) {
            log.warn("[{}] Payment IPN amount mismatch for order {}: expected {}, got {}",
                    MessageCodes.MSG_PAY_004, order.getOrderCode(), expectedMinor, result.amount());
            return IpnAckResponse.of("04", "Invalid Amount");
        }

        if (order.getStatus() == OrderStatus.PAID) {
            // Duplicate/replayed callback — already processed.
            log.info("[{}] Duplicate payment IPN for already-paid order {}",
                    MessageCodes.MSG_PAY_005, order.getOrderCode());
            return IpnAckResponse.of("02", "Order already confirmed");
        }

        PaymentTransaction transaction = latestOrNewTransaction(order);
        transaction.setProviderTransactionId(result.providerTransactionId());
        transaction.setRawResponse(objectMapper.valueToTree(params));

        if (!result.paymentSuccessful()) {
            transaction.setStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(transaction);
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            log.info("[{}] Recorded FAILED payment for order {} (responseCode={})",
                    MessageCodes.MSG_PAY_003, order.getOrderCode(), result.responseCode());
            return IpnAckResponse.of("00", "Confirm Success");
        }

        transaction.setStatus(PaymentStatus.SUCCESS);
        paymentTransactionRepository.save(transaction);

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // Fulfilment depends on what the order is for (no longer hardcoded to course purchase).
        if (order.getType() == OrderType.WALLET_TOPUP) {
            fulfillWalletTopUp(order);
            log.info("[{}] Confirmed wallet top-up for order {} — balance credited",
                    MessageCodes.MSG_PAY_002, order.getOrderCode());
        } else {
            // Combined payment: also deduct the wallet portion now that the gateway part succeeded.
            if (order.getWalletAmount() != null && order.getWalletAmount().signum() > 0) {
                studentWalletService.debitBalance(
                        order.getStudent().getId(),
                        order.getWalletAmount(),
                        "ORDER",
                        order.getId(),
                        "Phần thanh toán từ ví cho đơn " + order.getOrderCode());
            }
            fulfillCourseOrder(order);
            log.info("[{}] Confirmed payment for order {} — enrollment + escrow created",
                    MessageCodes.MSG_PAY_002, order.getOrderCode());
        }
        return IpnAckResponse.of("00", "Confirm Success");
    }

    @Override
    @Transactional
    public void payWithWallet(Order order) {
        WalletTransaction debit = studentWalletService.debitBalance(
                order.getStudent().getId(),
                order.getTotalAmount(),
                "ORDER",
                order.getId(),
                "Thanh toán khoá học đơn " + order.getOrderCode());

        PaymentTransaction transaction = PaymentTransaction.builder()
                .order(order)
                .provider("WALLET")
                .providerTransactionId(debit.getId().toString())
                .amount(order.getTotalAmount())
                .status(PaymentStatus.SUCCESS)
                .build();
        paymentTransactionRepository.save(transaction);

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        fulfillCourseOrder(order);

        log.info("[{}] Paid order {} with wallet — enrollment + escrow created",
                MessageCodes.MSG_PAY_002, order.getOrderCode());
    }

    @Override
    @Transactional
    public String initiateCombinedPayment(Order order, String clientIp) {
        BigDecimal balance = studentWalletService
                .getOrCreateStudentWallet(order.getStudent().getId())
                .getBalance();
        BigDecimal total = order.getTotalAmount();

        if (balance.compareTo(total) >= 0) {
            // Wallet fully covers the order — pay entirely from wallet, no gateway.
            payWithWallet(order);
            return null;
        }
        if (balance.signum() > 0) {
            // Use all available wallet balance; charge the remainder via VNPay.
            order.setWalletAmount(balance);
            orderRepository.save(order);
        }
        return initiatePayment(order, clientIp);
    }

    /** Fulfils a paid COURSE order: enrollment(s) + teacher escrow hold + student notification. */
    private void fulfillCourseOrder(Order order) {
        createEnrollments(order);
        escrowService.holdForOrder(order);
        notifyStudent(order);
    }

    private void fulfillWalletTopUp(Order order) {
        StudentProfile student = order.getStudent();
        studentWalletService.creditBalance(
                student.getId(),
                order.getTotalAmount(),
                "WALLET_TOPUP",
                order.getId(),
                "Nạp ví qua đơn " + order.getOrderCode());
        notifyTopUp(order);
    }

    private PaymentTransaction latestOrNewTransaction(Order order) {
        List<PaymentTransaction> existing =
                paymentTransactionRepository.findByOrder_IdOrderByCreatedAtDesc(order.getId());
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        return PaymentTransaction.builder()
                .order(order)
                .provider(paymentGateway.getProvider())
                .amount(order.getGatewayAmount())
                .status(PaymentStatus.PENDING)
                .build();
    }

    private void createEnrollments(Order order) {
        StudentProfile student = order.getStudent();
        for (OrderItem item : orderItemRepository.findByOrder_Id(order.getId())) {
            Course course = item.getCourse();
            boolean alreadyEnrolled = enrollmentRepository
                    .findByStudent_IdAndCourse_Id(student.getId(), course.getId())
                    .isPresent();
            if (!alreadyEnrolled) {
                enrollmentRepository.save(Enrollment.builder()
                        .student(student)
                        .course(course)
                        .status(EnrollmentStatus.ACTIVE)
                        .build());
            }
        }
    }

    private void notifyStudent(Order order) {
        StudentProfile student = order.getStudent();
        AppUser user = student.getUser();
        notificationService.createNotification(
                user.getId(),
                user.getEmail(),
                "Mua khoá học thành công",
                "Đơn hàng " + order.getOrderCode()
                        + " đã được thanh toán thành công. Bạn có thể bắt đầu học ngay bây giờ.",
                NOTIFICATION_TYPE);
    }

    private void notifyTopUp(Order order) {
        StudentProfile student = order.getStudent();
        AppUser user = student.getUser();
        notificationService.createNotification(
                user.getId(),
                user.getEmail(),
                "Nạp ví thành công",
                "Đơn nạp ví " + order.getOrderCode() + " ("
                        + order.getTotalAmount().toPlainString() + "đ) đã được xử lý thành công. "
                        + "Số dư ví của bạn đã được cập nhật.",
                "WALLET_TOPUP_SUCCESS");
    }
}
