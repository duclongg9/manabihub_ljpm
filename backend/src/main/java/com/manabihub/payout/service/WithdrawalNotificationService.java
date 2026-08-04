package com.manabihub.payout.service;

import com.manabihub.notification.service.NotificationService;
import com.manabihub.notification.NotificationTypes;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WithdrawalNotificationService {

    private final NotificationService notificationService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyFinanceManager(UUID withdrawalId, BigDecimal amount) {
        notificationService.createNotificationForAdminRole(
                "FINANCE_MANAGER",
                "Yêu cầu rút doanh thu mới",
                "Giáo viên vừa yêu cầu rút " + amount + " VND.",
                NotificationTypes.WITHDRAWAL_REQUESTED,
                "/admin/payouts/" + withdrawalId
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyTeacherCancellation(
            UUID userId,
            String email,
            BigDecimal amount
    ) {
        notificationService.createNotification(
                userId,
                email,
                "Đã hủy lệnh rút tiền",
                "Bạn đã hủy thành công lệnh rút tiền " + amount + " VND.",
                NotificationTypes.PAYOUT_CANCELLED,
                "/teacher/wallet"
        );
    }
}
