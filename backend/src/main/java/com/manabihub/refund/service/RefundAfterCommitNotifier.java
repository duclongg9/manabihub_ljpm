package com.manabihub.refund.service;

import com.manabihub.notification.service.NotificationService;
import com.manabihub.notification.NotificationTypes;
import com.manabihub.refund.enums.RefundStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class RefundAfterCommitNotifier {

    private final NotificationService notificationService;

    public void schedule(
            UUID refundRequestId,
            RefundStatus outcome,
            Recipient student,
            Recipient teacher,
            String orderCode,
            String courseTitle
    ) {
        Runnable notificationTask = () -> notifyRecipients(
                refundRequestId,
                outcome,
                student,
                teacher,
                orderCode,
                courseTitle
        );
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            notificationTask.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        notificationTask.run();
                    }
                }
        );
    }

    private void notifyRecipients(
            UUID refundRequestId,
            RefundStatus outcome,
            Recipient student,
            Recipient teacher,
            String orderCode,
            String courseTitle
    ) {
        try {
            boolean approved = outcome == RefundStatus.APPROVED;
            String studentTitle = approved
                    ? "Yêu cầu hoàn tiền được xác nhận"
                    : "Yêu cầu hoàn tiền bị từ chối";
            String studentMessage = approved
                    ? "Khoản hoàn tiền cho " + courseTitle
                    + " đã được nhà cung cấp thanh toán xác nhận."
                    : "Yêu cầu hoàn tiền cho " + courseTitle
                    + " đã bị từ chối. Xem ghi chú quyết định để biết chi tiết.";
            notificationService.createNotificationOnce(
                    dedupeKey(refundRequestId, outcome, "student"),
                    student.userId(),
                    student.email(),
                    studentTitle,
                    studentMessage,
                    NotificationTypes.REFUND,
                    "/student/payments"
            );

            String teacherTitle = approved
                    ? "Khoản phân bổ đã được hoàn lại"
                    : "Yêu cầu hoàn tiền đã được xử lý";
            String teacherMessage = approved
                    ? "Đơn hàng " + orderCode + " cho " + courseTitle
                    + " đã được hoàn tiền; khoản phân bổ tương ứng đã được đảo."
                    : "Yêu cầu hoàn tiền của đơn " + orderCode + " cho "
                    + courseTitle + " đã bị từ chối; khoản phân bổ không thay đổi.";
            notificationService.createNotificationOnce(
                    dedupeKey(refundRequestId, outcome, "teacher"),
                    teacher.userId(),
                    teacher.email(),
                    teacherTitle,
                    teacherMessage,
                    NotificationTypes.REFUND,
                    "/teacher/wallet"
            );
        } catch (RuntimeException exception) {
            log.error(
                    "Unable to deliver refund decision notifications for {} after commit",
                    refundRequestId,
                    exception
            );
        }
    }

    private String dedupeKey(UUID refundRequestId, RefundStatus outcome, String recipient) {
        return "refund:" + refundRequestId + ":" + outcome + ":" + recipient;
    }

    public record Recipient(UUID userId, String email) {
    }
}
