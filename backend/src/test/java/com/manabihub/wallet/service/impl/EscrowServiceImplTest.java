package com.manabihub.wallet.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.repository.OrderItemRepository;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    @InjectMocks
    private EscrowServiceImpl service;

    private Order order;
    private Course course;
    private TeacherProfile teacher;

    @BeforeEach
    void setUp() {
        teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        course = Course.builder().id(UUID.randomUUID()).title("N3 Grammar").teacher(teacher).build();
        order = Order.builder().id(UUID.randomUUID()).orderCode("OD1").build();
    }

    @Test
    void holdForOrder_createsHeldLedgerEntryAndFreezesTeacherWallet() {
        when(escrowLedgerRepository.existsByOrder_Id(order.getId())).thenReturn(false);
        when(orderItemRepository.findByOrder_Id(order.getId())).thenReturn(List.of(
                OrderItem.builder().order(order).course(course).price(new BigDecimal("150000.00")).build()));
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
    void findPendingEscrowForTeacher_returnsHeldAndFrozenEntriesForTeacher() {
        EscrowLedger heldEntry = EscrowLedger.builder().id(UUID.randomUUID()).teacher(teacher)
                .status(EscrowStatus.HELD).amount(new BigDecimal("150000.00")).build();
        when(escrowLedgerRepository.findByTeacher_IdAndStatusInOrderByCreatedAtDesc(
                eq(teacher.getId()), eq(List.of(EscrowStatus.HELD, EscrowStatus.FROZEN))))
                .thenReturn(List.of(heldEntry));

        List<EscrowLedger> result = service.findPendingEscrowForTeacher(teacher);

        assertEquals(List.of(heldEntry), result);
    }

    @Test
    void holdForOrder_whenEscrowAlreadyExists_isIdempotentNoOp() {
        when(escrowLedgerRepository.existsByOrder_Id(order.getId())).thenReturn(true);
        when(escrowLedgerRepository.findByOrder_Id(order.getId())).thenReturn(List.of(new EscrowLedger()));

        service.holdForOrder(order);

        verify(escrowLedgerRepository, never()).save(any());
        verify(walletService, never()).holdEscrow(any(), any(), any(), any(), any());
    }
}
