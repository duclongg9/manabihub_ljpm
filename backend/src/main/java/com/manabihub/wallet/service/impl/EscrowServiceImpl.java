package com.manabihub.wallet.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EscrowServiceImpl implements EscrowService {

    /** How long funds stay held before becoming eligible for teacher payout. */
    private static final Duration HOLD_PERIOD = Duration.ofDays(7);

    private final EscrowLedgerRepository escrowLedgerRepository;
    private final OrderItemRepository orderItemRepository;
    private final WalletService walletService;

    @Override
    @Transactional
    public List<EscrowLedger> holdForOrder(Order order) {
        // Idempotency guard — an order must never produce more than one set of holds.
        if (escrowLedgerRepository.existsByOrder_Id(order.getId())) {
            return escrowLedgerRepository.findByOrder_Id(order.getId());
        }

        Instant releaseAt = Instant.now().plus(HOLD_PERIOD);
        List<EscrowLedger> created = new ArrayList<>();

        for (OrderItem item : orderItemRepository.findByOrder_Id(order.getId())) {
            Course course = item.getCourse();
            TeacherProfile teacher = course.getTeacher();

            EscrowLedger ledger = escrowLedgerRepository.save(EscrowLedger.builder()
                    .order(order)
                    .course(course)
                    .teacher(teacher)
                    .amount(item.getPrice())
                    .status(EscrowStatus.HELD)
                    .releaseAt(releaseAt)
                    .build());

            walletService.holdEscrow(
                    teacher,
                    item.getPrice(),
                    "ORDER",
                    order.getId(),
                    "Escrow hold for order " + order.getOrderCode());

            created.add(ledger);
        }

        return created;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EscrowLedger> findPendingEscrowForTeacher(TeacherProfile teacher) {
        return escrowLedgerRepository.findByTeacher_IdAndStatusInOrderByCreatedAtDesc(
                teacher.getId(), List.of(EscrowStatus.HELD, EscrowStatus.FROZEN));
    }
}
