package com.manabihub.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.learning.entity.Enrollment;
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
import com.manabihub.payment.event.PaymentNotificationEvent;
import com.manabihub.payment.gateway.PaymentCallbackResult;
import com.manabihub.payment.gateway.PaymentGateway;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.StudentWalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private PaymentGateway paymentGateway;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private EscrowService escrowService;
    @Mock private StudentWalletService studentWalletService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private PaymentServiceImpl service;

    private Order order;
    private Course course;
    private final Map<String, String> params = Map.of("vnp_TxnRef", "OD1", "vnp_ResponseCode", "00");

    @BeforeEach
    void setUp() {
        service = new PaymentServiceImpl(
                paymentGateway, orderRepository, orderItemRepository, paymentTransactionRepository,
                enrollmentRepository, escrowService, studentWalletService, eventPublisher,
                new ObjectMapper());

        AppUser user = AppUser.builder().id(UUID.randomUUID()).email("student@test.dev").build();
        StudentProfile student = StudentProfile.builder().id(UUID.randomUUID()).user(user).build();
        course = Course.builder().id(UUID.randomUUID()).title("N3 Grammar").build();
        order = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD1")
                .totalAmount(new BigDecimal("100.00"))
                .currency("VND")
                .status(OrderStatus.PENDING)
                .student(student)
                .build();

        lenient().when(paymentGateway.getProvider()).thenReturn("VNPAY");
    }

    private PaymentCallbackResult result(boolean validSig, boolean success, long amount) {
        return new PaymentCallbackResult(validSig, "OD1", "99999", amount,
                success ? "00" : "24", success ? "00" : "02", success);
    }

    @Test
    void handleIpn_validSuccessfulCallback_confirmsOrderAndCreatesEnrollmentEscrowNotification() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000L));
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrder_IdOrderByCreatedAtDesc(order.getId()))
                .thenReturn(List.of(PaymentTransaction.builder().order(order).status(PaymentStatus.PENDING).build()));
        when(orderItemRepository.findByOrder_Id(order.getId()))
                .thenReturn(List.of(OrderItem.builder().order(order).course(course).price(new BigDecimal("100.00")).build()));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(any(), any())).thenReturn(Optional.empty());

        IpnAckResponse ack = service.handleIpn(params);

        assertEquals("00", ack.rspCode());
        assertEquals(OrderStatus.PAID, order.getStatus());

        ArgumentCaptor<PaymentTransaction> txCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(txCaptor.capture());
        assertEquals(PaymentStatus.SUCCESS, txCaptor.getValue().getStatus());
        assertEquals("99999", txCaptor.getValue().getProviderTransactionId());

        verify(enrollmentRepository).save(any(Enrollment.class));
        verify(escrowService).holdForOrder(order);
        verify(eventPublisher).publishEvent(any(PaymentNotificationEvent.class));
    }

    @Test
    void handleIpn_invalidSignature_returns97AndDoesNothing() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(false, true, 10_000L));

        IpnAckResponse ack = service.handleIpn(params);

        assertEquals("97", ack.rspCode());
        verify(orderRepository, never()).findByOrderCodeForUpdate(anyString());
        verify(enrollmentRepository, never()).save(any());
        verify(escrowService, never()).holdForOrder(any());
    }

    @Test
    void handleIpn_orderNotFound_returns01() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000L));
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.empty());

        assertEquals("01", service.handleIpn(params).rspCode());
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    void handleIpn_amountMismatch_returns04() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 999L));
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.of(order));

        assertEquals("04", service.handleIpn(params).rspCode());
        verify(enrollmentRepository, never()).save(any());
        verify(escrowService, never()).holdForOrder(any());
    }

    @Test
    void handleIpn_alreadyPaidOrder_isIdempotent_returns02() {
        order.setStatus(OrderStatus.PAID);
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000L));
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.of(order));

        IpnAckResponse ack = service.handleIpn(params);

        assertEquals("02", ack.rspCode());
        // No side effects on a replayed callback.
        verify(paymentTransactionRepository, never()).save(any());
        verify(enrollmentRepository, never()).save(any());
        verify(escrowService, never()).holdForOrder(any());
        verify(eventPublisher, never()).publishEvent(any(PaymentNotificationEvent.class));
    }

    @Test
    void handleIpn_failedPaymentAtProvider_recordsFailedAndReturns00() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, false, 10_000L));
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrder_IdOrderByCreatedAtDesc(order.getId()))
                .thenReturn(List.of(PaymentTransaction.builder().order(order).status(PaymentStatus.PENDING).build()));

        IpnAckResponse ack = service.handleIpn(params);

        assertEquals("00", ack.rspCode());
        assertEquals(OrderStatus.FAILED, order.getStatus());
        verify(enrollmentRepository, never()).save(any());
        verify(escrowService, never()).holdForOrder(any());
        verify(eventPublisher, never()).publishEvent(any(PaymentNotificationEvent.class));
    }

    @Test
    void handleIpn_walletTopUp_creditsStudentWalletNotEnrollment() {
        Order topUp = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD1")
                .totalAmount(new BigDecimal("100.00"))
                .currency("VND")
                .status(OrderStatus.PENDING)
                .student(order.getStudent())
                .type(OrderType.WALLET_TOPUP)
                .build();
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000L));
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.of(topUp));
        when(paymentTransactionRepository.findByOrder_IdOrderByCreatedAtDesc(topUp.getId()))
                .thenReturn(List.of(PaymentTransaction.builder().order(topUp).status(PaymentStatus.PENDING).build()));

        IpnAckResponse ack = service.handleIpn(params);

        assertEquals("00", ack.rspCode());
        assertEquals(OrderStatus.PAID, topUp.getStatus());
        verify(studentWalletService).creditBalance(
                eq(topUp.getStudent().getId()), eq(new BigDecimal("100.00")),
                eq("WALLET_TOPUP"), eq(topUp.getId()), anyString());
        // A top-up must never create enrollment or escrow.
        verify(enrollmentRepository, never()).save(any());
        verify(escrowService, never()).holdForOrder(any());
        verify(eventPublisher).publishEvent(any(PaymentNotificationEvent.class));
    }

    @Test
    void payWithWallet_debitsWalletAndFulfilsCourseOrder() {
        when(orderRepository.findByIdForUpdate(order.getId())).thenReturn(Optional.of(order));
        when(studentWalletService.debitBalance(any(), any(), any(), any(), any()))
                .thenReturn(WalletTransaction.builder().id(UUID.randomUUID()).build());
        when(orderItemRepository.findByOrder_Id(order.getId()))
                .thenReturn(List.of(OrderItem.builder().order(order).course(course).price(new BigDecimal("100.00")).build()));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(any(), any())).thenReturn(Optional.empty());

        Order paidOrder = service.payWithWallet(order.getId());

        assertEquals(order, paidOrder);
        assertEquals(OrderStatus.PAID, order.getStatus());
        verify(studentWalletService).debitBalance(
                eq(order.getStudent().getId()), eq(new BigDecimal("100.00")),
                eq("ORDER"), eq(order.getId()), anyString());
        verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
        verify(enrollmentRepository).save(any(Enrollment.class));
        verify(escrowService).holdForOrder(order);
        ArgumentCaptor<PaymentNotificationEvent> eventCaptor =
                ArgumentCaptor.forClass(PaymentNotificationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(order.getId(), eventCaptor.getValue().orderId());
        assertEquals("student@test.dev", eventCaptor.getValue().recipientEmail());
    }

    @Test
    void payWithWallet_alreadyPaidOrder_isIdempotent() {
        order.setStatus(OrderStatus.PAID);
        when(orderRepository.findByIdForUpdate(order.getId())).thenReturn(Optional.of(order));

        assertEquals(order, service.payWithWallet(order.getId()));

        verify(studentWalletService, never()).debitBalance(any(), any(), any(), any(), any());
        verify(paymentTransactionRepository, never()).save(any());
        verify(enrollmentRepository, never()).save(any());
        verify(escrowService, never()).holdForOrder(any());
        verify(eventPublisher, never()).publishEvent(any(PaymentNotificationEvent.class));
    }

    @Test
    void handleIpn_combinedPayment_debitsWalletPortionAndConfirms() {
        order.setWalletAmount(new BigDecimal("30.00")); // 30 from wallet → gateway charges 70.00
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 7_000L)); // 70.00 × 100
        when(orderRepository.findByOrderCodeForUpdate("OD1")).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrder_IdOrderByCreatedAtDesc(order.getId()))
                .thenReturn(List.of(PaymentTransaction.builder().order(order).status(PaymentStatus.PENDING).build()));
        when(orderItemRepository.findByOrder_Id(order.getId()))
                .thenReturn(List.of(OrderItem.builder().order(order).course(course).price(new BigDecimal("100.00")).build()));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(any(), any())).thenReturn(Optional.empty());

        IpnAckResponse ack = service.handleIpn(params);

        assertEquals("00", ack.rspCode());
        verify(studentWalletService).debitBalance(
                eq(order.getStudent().getId()), eq(new BigDecimal("30.00")),
                eq("ORDER"), eq(order.getId()), anyString());
        verify(enrollmentRepository).save(any(Enrollment.class));
        verify(escrowService).holdForOrder(order);
    }

    @Test
    void initiateCombinedPayment_partialBalance_setsWalletPortionAndChargesRemainder() {
        when(studentWalletService.getOrCreateStudentWallet(any()))
                .thenReturn(Wallet.builder().id(UUID.randomUUID()).balance(new BigDecimal("40.00")).build());
        when(paymentGateway.buildPaymentUrl(eq(order), anyString())).thenReturn("https://vnpay/pay");

        String url = service.initiateCombinedPayment(order, "1.2.3.4");

        assertEquals("https://vnpay/pay", url);
        assertEquals(new BigDecimal("40.00"), order.getWalletAmount());
        assertEquals(new BigDecimal("60.00"), order.getGatewayAmount());
        verify(orderRepository).save(order);
    }

    @Test
    void initiatePayment_savesPendingTransactionAndReturnsPaymentUrl() {
        when(paymentGateway.buildPaymentUrl(order, "1.2.3.4")).thenReturn("https://sandbox.vnpayment.vn/pay?x=1");

        String url = service.initiatePayment(order, "1.2.3.4");

        assertEquals("https://sandbox.vnpayment.vn/pay?x=1", url);
        ArgumentCaptor<PaymentTransaction> txCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(txCaptor.capture());
        assertEquals(PaymentStatus.PENDING, txCaptor.getValue().getStatus());
        assertEquals(new BigDecimal("100.00"), txCaptor.getValue().getAmount());
    }
}
