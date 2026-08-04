package com.manabihub.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.service.EnrollmentProgressResetService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.enums.OrderType;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.payment.dto.IpnAckResponse;
import com.manabihub.payment.entity.PaymentTransaction;
import com.manabihub.payment.enums.PaymentStatus;
import com.manabihub.payment.event.PaymentNotificationEvent;
import com.manabihub.notification.NotificationTypes;
import com.manabihub.payment.gateway.PaymentCallbackResult;
import com.manabihub.payment.gateway.PaymentGateway;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.payment.service.PaymentService;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.StudentWalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private static final BigDecimal MINOR_UNIT_FACTOR = BigDecimal.valueOf(100);
    private static final Duration WALLET_RESERVATION_TTL = Duration.ofMinutes(15);
    private static final String WALLET_PROVIDER = "WALLET";

    private final PaymentGateway paymentGateway;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentProgressResetService enrollmentProgressResetService;
    private final EscrowService escrowService;
    private final StudentWalletService studentWalletService;
    private final ApplicationEventPublisher eventPublisher;
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

        PaymentTransaction transaction = latestOrNewGatewayTransaction(order);
        transaction.setProviderTransactionId(result.providerTransactionId());
        transaction.setRawResponse(objectMapper.valueToTree(params));

        if (!result.paymentSuccessful()) {
            transaction.setStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(transaction);
            failWalletComponent(order);
            studentWalletService.releaseForOrder(order.getId(), Instant.now());
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            notifyPaymentFailed(order);
            log.info("[{}] Recorded FAILED payment for order {} (responseCode={})",
                    MessageCodes.MSG_PAY_003, order.getOrderCode(), result.responseCode());
            return IpnAckResponse.of("00", "Confirm Success");
        }

        Instant succeededAt = transaction.getSucceededAt() == null
                ? Instant.now()
                : transaction.getSucceededAt();
        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setSucceededAt(succeededAt);
        paymentTransactionRepository.save(transaction);

        // Fulfilment depends on what the order is for (no longer hardcoded to course purchase).
        if (order.getType() == OrderType.WALLET_TOPUP) {
            fulfillWalletTopUp(order);
            log.info("[{}] Confirmed wallet top-up for order {} — balance credited",
                    MessageCodes.MSG_PAY_002, order.getOrderCode());
        } else {
            // The wallet share was frozen before redirecting to VNPay. Capture that
            // reservation now; it can no longer be spent by a concurrent order.
            if (order.getWalletAmount() != null && order.getWalletAmount().signum() > 0) {
                try {
                    WalletTransaction walletDebit = studentWalletService
                            .captureForOrder(order.getId(), succeededAt);
                    succeedWalletComponent(order, walletDebit, succeededAt);
                } catch (BusinessException captureFailure) {
                    order.setStatus(OrderStatus.FAILED);
                    orderRepository.save(order);
                    notifyPaymentFailed(order);
                    log.error(
                            "[{}] Gateway payment succeeded but wallet reservation capture requires reconciliation for order {}",
                            MessageCodes.MSG_PAY_004,
                            order.getOrderCode(),
                            captureFailure);
                    return IpnAckResponse.of("00", "Confirm Success");
                }
            }
            // Escrow allocation requires a persisted PAID order. This write remains
            // in the same transaction, so a fulfilment error rolls everything back.
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            fulfillCourseOrder(order);
            log.info("[{}] Confirmed payment for order {} — enrollment + escrow created",
                    MessageCodes.MSG_PAY_002, order.getOrderCode());
        }
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        return IpnAckResponse.of("00", "Confirm Success");
    }

    @Override
    @Transactional
    public Order payWithWallet(UUID orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.ORDER_NOT_FOUND,
                        "Order was not found",
                        HttpStatus.NOT_FOUND));

        if (order.getStatus() == OrderStatus.PAID) {
            log.info("[{}] Ignored duplicate wallet payment for already-paid order {}",
                    MessageCodes.MSG_PAY_005, order.getOrderCode());
            return order;
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(
                    MessageCodes.COMMON_CONFLICT,
                    "Only a pending order can be paid with wallet",
                    HttpStatus.CONFLICT);
        }

        Instant succeededAt = Instant.now();
        order.setWalletAmount(order.getTotalAmount());
        orderRepository.save(order);
        studentWalletService.reserveForOrder(
                order.getStudent().getId(),
                order.getId(),
                order.getTotalAmount(),
                succeededAt.plus(WALLET_RESERVATION_TTL));
        WalletTransaction debit = studentWalletService.captureForOrder(order.getId(), succeededAt);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .order(order)
                .provider(WALLET_PROVIDER)
                .providerTransactionId(debit.getId().toString())
                .amount(order.getTotalAmount())
                .status(PaymentStatus.SUCCESS)
                .succeededAt(succeededAt)
                .build();
        paymentTransactionRepository.save(transaction);

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        fulfillCourseOrder(order);

        log.info("[{}] Paid order {} with wallet — enrollment + escrow created",
                MessageCodes.MSG_PAY_002, order.getOrderCode());
        return order;
    }

    @Override
    @Transactional
    public String initiateCombinedPayment(Order order, String clientIp) {
        BigDecimal balance = studentWalletService
                .getOrCreateStudentWallet(order.getStudent().getId())
                .getAvailableBalance();
        BigDecimal total = order.getTotalAmount();

        if (balance.compareTo(total) >= 0) {
            // Wallet fully covers the order — pay entirely from wallet, no gateway.
            Order paidOrder = payWithWallet(order.getId());
            order.setStatus(paidOrder.getStatus());
            return null;
        }
        if (balance.signum() > 0) {
            // Freeze the wallet share before constructing the gateway request. If a
            // concurrent order reserved it first, this fails before VNPay can charge.
            BigDecimal walletAmount = balance.min(total);
            var reservation = studentWalletService.reserveForOrder(
                    order.getStudent().getId(),
                    order.getId(),
                    walletAmount,
                    Instant.now().plus(WALLET_RESERVATION_TTL));
            order.setWalletAmount(reservation.getAmount());
            orderRepository.save(order);
            paymentTransactionRepository.save(PaymentTransaction.builder()
                    .order(order)
                    .provider(WALLET_PROVIDER)
                    .providerTransactionId(reservation.getId().toString())
                    .amount(reservation.getAmount())
                    .status(PaymentStatus.PENDING)
                    .build());
        }
        return initiatePayment(order, clientIp);
    }

    /** Fulfils a paid COURSE order: enrollment(s) + teacher escrow hold + student notification. */
    private void fulfillCourseOrder(Order order) {
        createEnrollments(order);
        escrowService.holdForOrder(order);
        notifyStudent(order);
        notifyTeachers(order);
    }

    private void fulfillWalletTopUp(Order order) {
        StudentProfile student = order.getStudent();
        studentWalletService.creditTopUp(
                student.getId(),
                order.getTotalAmount(),
                order.getId(),
                "Nạp ví qua đơn " + order.getOrderCode());
        notifyTopUp(order);
    }

    private PaymentTransaction latestOrNewGatewayTransaction(Order order) {
        PaymentTransaction existing = paymentTransactionRepository
                .findFirstByOrder_IdAndProviderOrderByCreatedAtDesc(
                        order.getId(),
                        paymentGateway.getProvider())
                .orElse(null);
        if (existing != null) {
            return existing;
        }
        return PaymentTransaction.builder()
                .order(order)
                .provider(paymentGateway.getProvider())
                .amount(order.getGatewayAmount())
                .status(PaymentStatus.PENDING)
                .build();
    }

    private void succeedWalletComponent(
            Order order,
            WalletTransaction debit,
            Instant succeededAt
    ) {
        PaymentTransaction walletPayment = paymentTransactionRepository
                .findFirstByOrder_IdAndProviderOrderByCreatedAtDesc(order.getId(), WALLET_PROVIDER)
                .orElseGet(() -> PaymentTransaction.builder()
                        .order(order)
                        .provider(WALLET_PROVIDER)
                        .amount(order.getWalletAmount())
                        .build());
        walletPayment.setProviderTransactionId(debit.getId().toString());
        walletPayment.setAmount(order.getWalletAmount());
        walletPayment.setStatus(PaymentStatus.SUCCESS);
        walletPayment.setSucceededAt(succeededAt);
        paymentTransactionRepository.save(walletPayment);
    }

    private void failWalletComponent(Order order) {
        paymentTransactionRepository
                .findFirstByOrder_IdAndProviderOrderByCreatedAtDesc(order.getId(), WALLET_PROVIDER)
                .ifPresent(walletPayment -> {
                    if (walletPayment.getStatus() == PaymentStatus.PENDING) {
                        walletPayment.setStatus(PaymentStatus.FAILED);
                        paymentTransactionRepository.save(walletPayment);
                    }
                });
    }

    private void createEnrollments(Order order) {
        StudentProfile student = order.getStudent();
        for (OrderItem item : orderItemRepository.findByOrder_Id(order.getId())) {
            Course course = item.getCourse();
            Enrollment existing = enrollmentRepository
                    .findByStudentIdAndCourseIdForUpdate(student.getId(), course.getId())
                    .orElse(null);
            if (existing == null) {
                enrollmentRepository.save(Enrollment.builder()
                        .student(student)
                        .course(course)
                        .status(EnrollmentStatus.ACTIVE)
                        .build());
            } else if (existing.getStatus() == EnrollmentStatus.REFUNDED) {
                enrollmentProgressResetService.resetForRepurchase(existing);
            }
        }
    }

    private void notifyStudent(Order order) {
        StudentProfile student = order.getStudent();
        AppUser user = student.getUser();
        eventPublisher.publishEvent(new PaymentNotificationEvent(
                order.getId(),
                user.getId(),
                user.getEmail(),
                "Mua khoá học thành công",
                "Đơn hàng " + order.getOrderCode()
                        + " đã được thanh toán thành công. Bạn có thể bắt đầu học ngay bây giờ.",
                NotificationTypes.PURCHASE_SUCCESS,
                "/student/courses"));
    }

    private void notifyTopUp(Order order) {
        StudentProfile student = order.getStudent();
        AppUser user = student.getUser();
        eventPublisher.publishEvent(new PaymentNotificationEvent(
                order.getId(),
                user.getId(),
                user.getEmail(),
                "Nạp ví thành công",
                "Đơn nạp ví " + order.getOrderCode() + " ("
                        + order.getTotalAmount().toPlainString() + "đ) đã được xử lý thành công. "
                        + "Số dư ví của bạn đã được cập nhật.",
                NotificationTypes.WALLET_TOPUP_SUCCESS,
                "/student/wallet"));
    }

    private void notifyPaymentFailed(Order order) {
        AppUser user = order.getStudent().getUser();
        eventPublisher.publishEvent(new PaymentNotificationEvent(
                order.getId(),
                user.getId(),
                user.getEmail(),
                "Thanh toán chưa thành công",
                "Đơn hàng " + order.getOrderCode()
                        + " chưa được thanh toán. Vui lòng kiểm tra lại phương thức thanh toán.",
                NotificationTypes.PAYMENT_FAILED,
                "/student/payments"));
    }

    private void notifyTeachers(Order order) {
        orderItemRepository.findByOrder_Id(order.getId()).stream()
                .filter(item -> item.getCourse() != null
                        && item.getCourse().getTeacher() != null
                        && item.getCourse().getTeacher().getUser() != null)
                .collect(Collectors.groupingBy(item -> item.getCourse().getTeacher().getUser().getId()))
                .values()
                .forEach(items -> {
            var teacherUser = items.getFirst().getCourse().getTeacher().getUser();
            String courseTitles = items.stream()
                    .map(item -> item.getCourse().getTitle())
                    .collect(Collectors.joining(", "));
            BigDecimal grossAmount = items.stream()
                    .map(OrderItem::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            eventPublisher.publishEvent(new PaymentNotificationEvent(
                    order.getId(),
                    teacherUser.getId(),
                    teacherUser.getEmail(),
                    "Khóa học vừa có học viên mới",
                    "Học viên vừa mua khóa học: " + courseTitles
                            + ". Tổng giá trị trước phân bổ: " + grossAmount.toPlainString() + " VND.",
                    NotificationTypes.TEACHER_SALE,
                    "/teacher/wallet"));
        });
    }
}
