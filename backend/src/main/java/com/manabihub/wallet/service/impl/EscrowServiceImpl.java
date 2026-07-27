package com.manabihub.wallet.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscrowServiceImpl implements EscrowService {

    private final EscrowLedgerRepository escrowLedgerRepository;
    private final OrderItemRepository orderItemRepository;
    private final WalletService walletService;
    private final AuditLogRepository auditLogRepository;
    private final SystemSettingRepository systemSettingRepository;

    private int getEscrowHoldingDays() {
        return systemSettingRepository.findBySettingKey("ESCROW_HOLDING_DAYS")
                .map(setting -> Integer.parseInt(setting.getSettingValue()))
                .orElse(14);
    }

    @Override
    @Transactional
    public List<EscrowLedger> holdForOrder(Order order) {
        // Idempotency guard — an order must never produce more than one set of holds.
        if (escrowLedgerRepository.existsByOrder_Id(order.getId())) {
            return escrowLedgerRepository.findByOrder_Id(order.getId());
        }

        int holdingDays = getEscrowHoldingDays();
        Instant releaseAt = Instant.now().plus(Duration.ofDays(holdingDays));
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
    @Transactional
    public boolean processEscrowRelease(UUID escrowId) {
        EscrowLedger escrow = escrowLedgerRepository.findByIdForUpdate(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found"));

        if (escrow.getStatus() != EscrowStatus.HELD) {
            log.info("Escrow {} is not HELD, skipping release", escrowId);
            return false;
        }

        if (escrow.getReleaseAt().isAfter(Instant.now())) {
            log.info("Escrow {} clearing time has not been reached, skipping release", escrowId);
            return false;
        }

        if (escrow.getTeacher().getUser().getUserStatus() != UserStatus.ACTIVE) {
            log.info("Escrow {} blocked due to inactive teacher account", escrowId);
            return false;
        }

        if (escrow.getOrder().getStatus() == OrderStatus.REFUNDED) {
            log.info("Escrow {} blocked due to refunded order", escrowId);
            return false;
        }

        escrow.setStatus(EscrowStatus.RELEASED);
        escrowLedgerRepository.save(escrow);

        walletService.releaseEscrow(
                escrow.getTeacher(),
                escrow.getAmount(),
                "ESCROW",
                escrow.getId(),
                "Escrow released to available balance");

        AuditLog auditLog = AuditLog.builder()
                .actorType("SYSTEM")
                .action("ESCROW_RELEASE")
                .targetType("ESCROW_LEDGER")
                .targetId(escrow.getId())
                .metadata(Map.of("decision", "APPROVED", "reason", "14-day clearing period met without blocking conditions"))
                .build();
        auditLogRepository.save(auditLog);

        return true;
    }
}
