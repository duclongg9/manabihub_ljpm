package com.manabihub.wallet.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.systemconfig.entity.SystemSetting;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EscrowServiceImplTest {

    @Mock private EscrowLedgerRepository escrowLedgerRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private WalletService walletService;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private SystemSettingRepository systemSettingRepository;

    @InjectMocks
    private EscrowServiceImpl service;

    private Order order;
    private Course course;
    private TeacherProfile teacher;

    @BeforeEach
    void setUp() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setUserStatus(UserStatus.ACTIVE);
        teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(user);
        course = Course.builder().id(UUID.randomUUID()).title("N3 Grammar").teacher(teacher).build();
        order = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD1")
                .status(OrderStatus.PAID)
                .build();
    }

    @Test
    void holdForOrder_createsHeldLedgerEntryAndFreezesTeacherWallet() {
        when(escrowLedgerRepository.existsByOrder_Id(order.getId())).thenReturn(false);
        when(orderItemRepository.findByOrder_Id(order.getId())).thenReturn(List.of(
                OrderItem.builder().order(order).course(course).price(new BigDecimal("150000.00")).build()));

        SystemSetting setting = new SystemSetting();
        setting.setSettingValue("14");
        when(systemSettingRepository.findBySettingKey("ESCROW_HOLDING_DAYS")).thenReturn(Optional.of(setting));

        when(escrowLedgerRepository.save(any(EscrowLedger.class))).thenAnswer(inv -> inv.getArgument(0));

        service.holdForOrder(order);

        ArgumentCaptor<EscrowLedger> captor = ArgumentCaptor.forClass(EscrowLedger.class);
        verify(escrowLedgerRepository).save(captor.capture());
        EscrowLedger ledger = captor.getValue();
        assertEquals(EscrowStatus.HELD, ledger.getStatus());
        assertEquals(new BigDecimal("150000.00"), ledger.getAmount());
        assertEquals(teacher, ledger.getTeacher());

        verify(walletService).holdEscrow(eq(teacher), eq(new BigDecimal("150000.00")),
                eq("ORDER"), eq(order.getId()), any());
    }

    @Test
    void holdForOrder_whenEscrowAlreadyExists_isIdempotentNoOp() {
        when(escrowLedgerRepository.existsByOrder_Id(order.getId())).thenReturn(true);
        when(escrowLedgerRepository.findByOrder_Id(order.getId())).thenReturn(List.of(new EscrowLedger()));

        service.holdForOrder(order);

        verify(escrowLedgerRepository, never()).save(any());
        verify(walletService, never()).holdEscrow(any(), any(), any(), any(), any());
    }

    @Test
    void processEscrowRelease_whenEligible_releasesOnceAndWritesAudit() {
        EscrowLedger escrow = eligibleEscrow();
        when(escrowLedgerRepository.findByIdForUpdate(escrow.getId())).thenReturn(Optional.of(escrow));
        when(escrowLedgerRepository.existsBlockingRefundRequest(order.getId())).thenReturn(false);
        when(escrowLedgerRepository.existsPendingTrustCase(course.getId(), teacher.getUser().getId()))
                .thenReturn(false);

        boolean released = service.processEscrowRelease(escrow.getId());

        assertTrue(released);
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        verify(walletService).releaseEscrow(
                teacher,
                escrow.getAmount(),
                "ESCROW",
                escrow.getId(),
                "Escrow released to available balance");
        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        assertEquals("ESCROW_RELEASE", auditCaptor.getValue().getAction());
        assertEquals(escrow.getId(), auditCaptor.getValue().getTargetId());
    }

    @Test
    void processEscrowRelease_whenRefundIsPending_keepsFundsHeld() {
        EscrowLedger escrow = eligibleEscrow();
        when(escrowLedgerRepository.findByIdForUpdate(escrow.getId())).thenReturn(Optional.of(escrow));
        when(escrowLedgerRepository.existsBlockingRefundRequest(order.getId())).thenReturn(true);

        assertFalse(service.processEscrowRelease(escrow.getId()));

        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        verify(walletService, never()).releaseEscrow(any(), any(), any(), any(), any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    void processEscrowRelease_whenTrustCaseIsOpen_keepsFundsHeld() {
        EscrowLedger escrow = eligibleEscrow();
        when(escrowLedgerRepository.findByIdForUpdate(escrow.getId())).thenReturn(Optional.of(escrow));
        when(escrowLedgerRepository.existsBlockingRefundRequest(order.getId())).thenReturn(false);
        when(escrowLedgerRepository.existsPendingTrustCase(course.getId(), teacher.getUser().getId()))
                .thenReturn(true);

        assertFalse(service.processEscrowRelease(escrow.getId()));

        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        verify(walletService, never()).releaseEscrow(any(), any(), any(), any(), any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    void processEscrowRelease_whenEscrowIsFrozen_isIdempotentNoOp() {
        EscrowLedger escrow = eligibleEscrow();
        escrow.setStatus(EscrowStatus.FROZEN);
        when(escrowLedgerRepository.findByIdForUpdate(escrow.getId())).thenReturn(Optional.of(escrow));

        assertFalse(service.processEscrowRelease(escrow.getId()));

        verify(walletService, never()).releaseEscrow(any(), any(), any(), any(), any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    void processEscrowRelease_whenOrderIsNotPaid_keepsFundsHeld() {
        EscrowLedger escrow = eligibleEscrow();
        order.setStatus(OrderStatus.CANCELLED);
        when(escrowLedgerRepository.findByIdForUpdate(escrow.getId())).thenReturn(Optional.of(escrow));

        assertFalse(service.processEscrowRelease(escrow.getId()));

        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        verify(walletService, never()).releaseEscrow(any(), any(), any(), any(), any());
    }

    private EscrowLedger eligibleEscrow() {
        return EscrowLedger.builder()
                .id(UUID.randomUUID())
                .order(order)
                .course(course)
                .teacher(teacher)
                .amount(new BigDecimal("150000.00"))
                .status(EscrowStatus.HELD)
                .releaseAt(Instant.now().minusSeconds(60))
                .createdAt(Instant.now().minusSeconds(120))
                .build();
    }
}
