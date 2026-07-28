package com.manabihub.wallet.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.order.entity.OrderItemSnapshot;
import com.manabihub.order.repository.OrderItemSnapshotRepository;
import com.manabihub.wallet.entity.PlatformCommissionLedger;
import com.manabihub.wallet.repository.PlatformCommissionLedgerRepository;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    private static final String ESCROW_HOLDING_DAYS = "ESCROW_HOLDING_DAYS";
    private static final String COMMISSION_RATE = "COMMISSION_RATE";
    private static final String POLICY_VERSION = "POLICY_VERSION";
    private static final int DEFAULT_HOLDING_DAYS = 14;
    private static final BigDecimal DEFAULT_COMMISSION_RATE = new BigDecimal("0.20");
    private static final String DEFAULT_POLICY_VERSION = "1.0.0-provisional";

    private final EscrowLedgerRepository escrowLedgerRepository;
    private final OrderItemRepository orderItemRepository;
    private final WalletService walletService;
    private final AuditLogRepository auditLogRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final OrderItemSnapshotRepository orderItemSnapshotRepository;
    private final PlatformCommissionLedgerRepository platformCommissionLedgerRepository;

    private int getEscrowHoldingDays() {
        String configuredValue = systemSettingRepository.findBySettingKey(ESCROW_HOLDING_DAYS)
                .map(setting -> setting.getSettingValue())
                .orElse(Integer.toString(DEFAULT_HOLDING_DAYS));
        try {
            int holdingDays = Integer.parseInt(configuredValue);
            if (holdingDays < 1 || holdingDays > 365) {
                throw new NumberFormatException("outside supported range");
            }
            return holdingDays;
        } catch (NumberFormatException exception) {
            log.warn("Invalid {} value; using the safe {}-day default",
                    ESCROW_HOLDING_DAYS, DEFAULT_HOLDING_DAYS);
            return DEFAULT_HOLDING_DAYS;
        }
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

        BigDecimal commissionRate = systemSettingRepository.findBySettingKey(COMMISSION_RATE)
                .map(setting -> new BigDecimal(setting.getSettingValue()))
                .orElse(DEFAULT_COMMISSION_RATE);

        String policyVersion = systemSettingRepository.findBySettingKey(POLICY_VERSION)
                .map(setting -> setting.getSettingValue())
                .orElse(DEFAULT_POLICY_VERSION);

        for (OrderItem item : orderItemRepository.findByOrder_Id(order.getId())) {
            Course course = item.getCourse();
            TeacherProfile teacher = course.getTeacher();

            BigDecimal grossAmount = item.getPrice();
            BigDecimal platformCommission = grossAmount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal teacherNet = grossAmount.subtract(platformCommission);

            orderItemSnapshotRepository.save(OrderItemSnapshot.builder()
                    .orderItem(item)
                    .currency("VND")
                    .grossAmount(grossAmount)
                    .commissionRate(commissionRate)
                    .commissionAmount(platformCommission)
                    .teacherNetAmount(teacherNet)
                    .commercialPolicyVersion(policyVersion)
                    .escrowDays(holdingDays)
                    .build());

            EscrowLedger ledger = escrowLedgerRepository.save(EscrowLedger.builder()
                    .order(order)
                    .course(course)
                    .teacher(teacher)
                    .amount(teacherNet)
                    .status(EscrowStatus.HELD)
                    .releaseAt(releaseAt)
                    .build());

            platformCommissionLedgerRepository.save(PlatformCommissionLedger.builder()
                    .order(order)
                    .orderItem(item)
                    .amount(platformCommission)
                    .status(PlatformCommissionLedger.CommissionStatus.HELD)
                    .build());

            walletService.holdEscrow(
                    teacher,
                    teacherNet,
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
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_NOT_FOUND,
                        "Escrow record was not found",
                        HttpStatus.NOT_FOUND));

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

        if (escrow.getOrder().getStatus() != OrderStatus.PAID) {
            log.info("Escrow {} blocked because order status is {}", escrowId, escrow.getOrder().getStatus());
            return false;
        }

        if (escrowLedgerRepository.existsBlockingRefundRequest(escrow.getOrder().getId())) {
            log.info("Escrow {} blocked by an active refund request", escrowId);
            return false;
        }

        if (escrowLedgerRepository.existsPendingTrustCase(
                escrow.getCourse().getId(),
                escrow.getTeacher().getUser().getId())) {
            log.info("Escrow {} blocked by an open trust case", escrowId);
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

        // Recognize platform commission
        for (OrderItem item : orderItemRepository.findByOrder_Id(escrow.getOrder().getId())) {
            if (item.getCourse().getId().equals(escrow.getCourse().getId())) {
                platformCommissionLedgerRepository.findByOrderItem_IdAndStatus(item.getId(), PlatformCommissionLedger.CommissionStatus.HELD)
                        .ifPresent(ledger -> {
                            ledger.setStatus(PlatformCommissionLedger.CommissionStatus.RECOGNIZED);
                            platformCommissionLedgerRepository.save(ledger);
                        });
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .actorType("SYSTEM")
                .action("ESCROW_RELEASE")
                .targetType("ESCROW_LEDGER")
                .targetId(escrow.getId())
                .metadata(Map.of(
                        "decision", "APPROVED",
                        "reason", "release_at reached with no refund, dispute, freeze, or account block",
                        "releaseAt", escrow.getReleaseAt().toString()))
                .build();
        auditLogRepository.save(auditLog);

        return true;
    }
}
