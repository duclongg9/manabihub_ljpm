package com.manabihub.wallet.service.impl;

import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.wallet.dto.response.StudentWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.mapper.WalletTransactionMapper;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentWalletServiceImplTest {

    @Mock private WalletService walletService;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private CurrentUserService currentUserService;

    private StudentWalletServiceImpl service;

    private UUID userId;
    private StudentProfile student;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        service = new StudentWalletServiceImpl(
                walletService, walletTransactionRepository, orderRepository,
                studentProfileRepository, currentUserService, new WalletTransactionMapper());

        userId = UUID.randomUUID();
        student = StudentProfile.builder().id(UUID.randomUUID()).build();
        wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.STUDENT)
                .student(student)
                .balance(new BigDecimal("25000.00"))
                .frozenBalance(BigDecimal.ZERO)
                .currency("VND")
                .updatedAt(Instant.parse("2026-07-20T00:00:00Z"))
                .build();

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        when(walletService.getOrCreateStudentWallet(student)).thenReturn(wallet);
    }

    @Test
    void getWalletSummary_sumsTopUpsPaymentsAndRefunds() {
        when(walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()))
                .thenReturn(List.of(topUpTransaction(new BigDecimal("100000.00"))));
        when(orderRepository.findByStudent_IdOrderByCreatedAtDesc(student.getId())).thenReturn(List.of(
                order(OrderStatus.PAID, new BigDecimal("500000.00"), "OD1"),
                order(OrderStatus.PENDING, new BigDecimal("300000.00"), "OD2"),
                order(OrderStatus.REFUNDED, new BigDecimal("200000.00"), "OD3"),
                order(OrderStatus.CANCELLED, new BigDecimal("999999.00"), "OD4")
        ));

        StudentWalletSummaryResponse summary = service.getWalletSummary();

        assertEquals(wallet.getId(), summary.walletId());
        assertEquals("VND", summary.currency());
        assertEquals(new BigDecimal("25000.00"), summary.balance());
        assertEquals(new BigDecimal("100000.00"), summary.totalTopUps());
        assertEquals(new BigDecimal("500000.00"), summary.totalPayments());
        assertEquals(new BigDecimal("200000.00"), summary.totalRefunds());
    }

    @Test
    void getWalletActivity_includesTopUpsPaymentsAndRefundsButExcludesCancelledOrders() {
        when(walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()))
                .thenReturn(List.of(topUpTransaction(new BigDecimal("100000.00"))));
        when(orderRepository.findByStudent_IdOrderByCreatedAtDesc(student.getId())).thenReturn(List.of(
                order(OrderStatus.PAID, new BigDecimal("500000.00"), "OD1"),
                order(OrderStatus.REFUNDED, new BigDecimal("200000.00"), "OD3"),
                order(OrderStatus.CANCELLED, new BigDecimal("999999.00"), "OD4")
        ));

        List<WalletActivityResponse> activity = service.getWalletActivity();

        assertEquals(3, activity.size());
        assertTrue(activity.stream().anyMatch(a -> a.section() == WalletTransactionSection.TOP_UP));
        assertTrue(activity.stream().anyMatch(a -> a.section() == WalletTransactionSection.PAYMENT && "OD1".equals(a.referenceCode())));
        assertTrue(activity.stream().anyMatch(a -> a.section() == WalletTransactionSection.REFUND && "OD3".equals(a.referenceCode())));
        assertTrue(activity.stream().noneMatch(a -> "OD4".equals(a.referenceCode())));
    }

    private WalletTransaction topUpTransaction(BigDecimal amount) {
        return WalletTransaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .transactionType(WalletTransactionType.ADJUSTMENT)
                .amount(amount)
                .direction(WalletDirection.IN)
                .referenceType("WALLET_TOPUP")
                .createdAt(Instant.parse("2026-07-25T00:00:00Z"))
                .build();
    }

    private Order order(OrderStatus status, BigDecimal amount, String code) {
        return Order.builder()
                .id(UUID.randomUUID())
                .student(student)
                .orderCode(code)
                .totalAmount(amount)
                .currency("VND")
                .status(status)
                .createdAt(Instant.parse("2026-07-24T00:00:00Z"))
                .updatedAt(Instant.parse("2026-07-24T01:00:00Z"))
                .build();
    }
}
