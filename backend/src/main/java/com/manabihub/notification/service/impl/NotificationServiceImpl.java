package com.manabihub.notification.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.mail.EmailService;
import com.manabihub.notification.dto.NotificationResponse;
import com.manabihub.notification.entity.Notification;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Override
    public Page<NotificationResponse> listMyNotifications(UUID userId, String type,
                                                          Boolean isRead, Pageable pageable) {
        Page<Notification> page;

        boolean hasType = type != null && !type.isBlank();
        boolean hasReadFilter = isRead != null;

        if (hasType && hasReadFilter) {
            page = notificationRepository
                    .findAllByRecipientUserIdAndNotificationTypeAndIsReadOrderByCreatedAtDesc(
                            userId, type, isRead, pageable);
        } else if (hasType) {
            page = notificationRepository
                    .findAllByRecipientUserIdAndNotificationTypeOrderByCreatedAtDesc(
                            userId, type, pageable);
        } else if (hasReadFilter) {
            page = notificationRepository
                    .findAllByRecipientUserIdAndIsReadOrderByCreatedAtDesc(
                            userId, isRead, pageable);
        } else {
            page = notificationRepository
                    .findAllByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        return page.map(this::toResponse);
    }

    @Override
    public long countUnread(UUID userId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.NOTIFICATION_NOT_FOUND,
                        "Notification not found",
                        HttpStatus.NOT_FOUND
                ));

        if (!userId.equals(notification.getRecipientUserId())) {
            throw new BusinessException(
                    MessageCodes.AUTH_FORBIDDEN,
                    "You do not have permission to access this notification",
                    HttpStatus.FORBIDDEN
            );
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsReadByRecipientUserId(userId, Instant.now());
    }

    @Override
    @Transactional
    public void createNotification(UUID recipientUserId, String recipientEmail,
                                   String title, String message, String type) {
        Notification notification = Notification.builder()
                .recipientUserId(recipientUserId)
                .title(title)
                .message(message)
                .notificationType(type)
                .build();

        notificationRepository.saveAndFlush(notification);
        log.info("Notification created for user {} — type={}, title={}",
                recipientUserId, type, title);

        if (recipientEmail != null && !recipientEmail.isBlank()) {
            String emailBody = buildEmailBody(title, message, type);
            emailService.sendEmail(recipientEmail, "[ManabiHub] " + title, emailBody);
        }
    }

    @Override
    public void sendTestEmailOnly(String recipientEmail, String title, String message, String type) {
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            String emailBody = buildEmailBody(title, message, type);
            emailService.sendEmail(recipientEmail, "[ManabiHub] " + title, emailBody);
        }
    }

    private NotificationResponse toResponse(Notification entity) {
        return NotificationResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .notificationType(entity.getNotificationType())
                .read(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .readAt(entity.getReadAt())
                .build();
    }

    private String buildEmailBody(String title, String message, String type) {
        return """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 ManabiHub</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                        <span style="display: inline-block; background: #e8f0fe; color: #1967d2; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 16px;">%s</span>
                        <h2 style="color: #333; margin: 0 0 12px 0;">%s</h2>
                        <p style="color: #555; line-height: 1.6;">%s</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                        <p style="color: #999; font-size: 12px;">Đây là email tự động từ hệ thống ManabiHub. Vui lòng không trả lời email này.</p>
                    </div>
                </div>
                """.formatted(type != null ? type : "SYSTEM", title, message);
    }
}
