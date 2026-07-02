package com.manabihub.notification.service;

import com.manabihub.notification.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Page<NotificationResponse> listMyNotifications(UUID userId, String type,
                                                   Boolean isRead, Pageable pageable);

    long countUnread(UUID userId);

    NotificationResponse markAsRead(UUID notificationId, UUID userId);

    int markAllAsRead(UUID userId);

    void createNotification(UUID recipientUserId, String recipientEmail,
                            String title, String message, String type);
}
