package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.PageResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.order.entity.Order;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
import com.manabihub.wallet.dto.request.WalletTransactionFilterRequest;
import com.manabihub.wallet.dto.response.WalletTransactionDetailResponse;
import com.manabihub.wallet.dto.response.WalletTransactionResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WalletTransactionServiceImplTest {

    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private TeacherProfileRepository teacherProfileRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private EscrowLedgerRepository escrowLedgerRepository;
    @Mock private WithdrawalRequestRepository withdrawalRequestRepository;

    @InjectMocks
    private WalletTransactionServiceImpl service;

    private UUID userId;
    private UUID studentId;
    private UUID walletId;
    private StudentProfile student;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        walletId = UUID.randomUUID();

        student = mock(StudentProfile.class);
        when(student.getId()).thenReturn(studentId);

        wallet = Wallet.builder()
                .id(walletId)
                .ownerType(WalletOwnerType.STUDENT)
                .balance(new BigDecimal("100000"))
                .frozenBalance(BigDecimal.ZERO)
                .currency("VND")
                .build();

        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
    }

    // ──────────────────────────────────────────────
    // History
    // ──────────────────────────────────────────────

    @Test
    void getStudentTransactions_returnsEmptyPage_whenWalletNotCreatedYet() {
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId)).thenReturn(Optional.empty());

        PageResponse<WalletTransactionResponse> result =
                service.getStudentTransactions(userId, null, PageRequest.of(0, 20));

        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
        verify(walletTransactionRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getStudentTransactions_mapsLedgerLinesAndResolvesOrderCode() {
        UUID orderId = UUID.randomUUID();
        WalletTransaction transaction = topUpTransaction(orderId);

        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(transaction), PageRequest.of(0, 20), 1));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order(orderId, "ORD-001")));

        PageResponse<WalletTransactionResponse> result =
                service.getStudentTransactions(userId, null, PageRequest.of(0, 20));

        assertEquals(1, result.getContent().size());
        WalletTransactionResponse line = result.getContent().get(0);
        assertEquals(WalletTransactionType.TOP_UP, line.transactionType());
        assertEquals(WalletDirection.IN, line.direction());
        assertEquals("ORD-001", line.referenceCode());
        assertEquals("VND", line.currency());
    }

    @Test
    void getStudentTransactions_appliesFiltersWithoutError() {
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        WalletTransactionFilterRequest filter = new WalletTransactionFilterRequest(
                List.of(WalletTransactionType.TOP_UP),
                WalletDirection.IN,
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 31),
                "ORD-001");

        when(orderRepository.findIdsByStudentIdAndOrderCodeLike(eq(studentId), eq("ORD-001")))
                .thenReturn(List.of(UUID.randomUUID()));

        PageResponse<WalletTransactionResponse> result =
                service.getStudentTransactions(userId, filter, PageRequest.of(0, 20));

        assertNotNull(result);
        verify(orderRepository).findIdsByStudentIdAndOrderCodeLike(studentId, "ORD-001");
    }

    @Test
    void getStudentTransactions_blankReferenceCodeIsTreatedAsNoSearch() {
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        WalletTransactionFilterRequest filter =
                new WalletTransactionFilterRequest(null, null, null, null, "   ");

        service.getStudentTransactions(userId, filter, PageRequest.of(0, 20));

        verify(orderRepository, never()).findIdsByStudentIdAndOrderCodeLike(any(), any());
    }

    // ──────────────────────────────────────────────
    // Detail / ownership
    // ──────────────────────────────────────────────

    @Test
    void getStudentTransactionDetail_returnsDetailWithRelatedOrder() {
        UUID orderId = UUID.randomUUID();
        WalletTransaction transaction = topUpTransaction(orderId);

        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.findByIdAndWalletId(transaction.getId(), walletId))
                .thenReturn(Optional.of(transaction));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order(orderId, "ORD-001")));

        WalletTransactionDetailResponse detail =
                service.getStudentTransactionDetail(userId, transaction.getId());

        assertEquals("ORD-001", detail.referenceCode());
        assertNotNull(detail.relatedRecord());
        assertEquals("WALLET_TOPUP", detail.relatedRecord().kind());
        assertEquals(OrderStatus.PAID.name(), detail.relatedRecord().status());
    }

    @Test
    void getStudentTransactionDetail_rejectsTransactionOwnedByAnotherWallet() {
        UUID foreignTransactionId = UUID.randomUUID();

        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.findByIdAndWalletId(foreignTransactionId, walletId))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.getStudentTransactionDetail(userId, foreignTransactionId));

        assertEquals(MessageCodes.WALLET_TRANSACTION_NOT_FOUND, exception.getMessageCode());
    }

    @Test
    void getTeacherTransactions_usesTeacherWalletAndNeverTheStudentOne() {
        UUID teacherUserId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UUID teacherWalletId = UUID.randomUUID();

        TeacherProfile teacher = mock(TeacherProfile.class);
        when(teacher.getId()).thenReturn(teacherId);
        when(teacherProfileRepository.findByUserId(teacherUserId)).thenReturn(Optional.of(teacher));

        Wallet teacherWallet = Wallet.builder()
                .id(teacherWalletId)
                .ownerType(WalletOwnerType.TEACHER)
                .balance(new BigDecimal("500000"))
                .frozenBalance(BigDecimal.ZERO)
                .currency("VND")
                .build();
        when(walletRepository.findByOwnerTypeAndTeacher_Id(WalletOwnerType.TEACHER, teacherId)).thenReturn(Optional.of(teacherWallet));
        when(walletTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        PageResponse<WalletTransactionResponse> result =
                service.getTeacherTransactions(teacherUserId, null, PageRequest.of(0, 20));

        assertNotNull(result);
        verify(walletRepository, never()).findByOwnerTypeAndStudent_Id(eq(WalletOwnerType.STUDENT), any());
    }

    // ──────────────────────────────────────────────
    // Fixtures
    // ──────────────────────────────────────────────

    private WalletTransaction topUpTransaction(UUID orderId) {
        return WalletTransaction.builder()
                .id(UUID.randomUUID())
                .walletId(walletId)
                .transactionType(WalletTransactionType.TOP_UP)
                .amount(new BigDecimal("100000"))
                .direction(WalletDirection.IN)
                .referenceType("WALLET_TOPUP")
                .referenceId(orderId)
                .note("Nạp ví")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Order order(UUID orderId, String orderCode) {
        return Order.builder()
                .id(orderId)
                .orderCode(orderCode)
                .totalAmount(new BigDecimal("100000"))
                .status(OrderStatus.PAID)
                .build();
    }
}
