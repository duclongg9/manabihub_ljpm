package com.manabihub.notification.repository;

import com.manabihub.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findAllByRecipientUserIdOrderByCreatedAtDesc(
            UUID recipientUserId, Pageable pageable);

    Page<Notification> findAllByRecipientUserIdAndIsReadOrderByCreatedAtDesc(
            UUID recipientUserId, boolean isRead, Pageable pageable);

    Page<Notification> findAllByRecipientUserIdAndNotificationTypeOrderByCreatedAtDesc(
            UUID recipientUserId, String notificationType, Pageable pageable);

    Page<Notification> findAllByRecipientUserIdAndNotificationTypeAndIsReadOrderByCreatedAtDesc(
            UUID recipientUserId, String notificationType, boolean isRead, Pageable pageable);

    long countByRecipientUserIdAndIsReadFalse(UUID recipientUserId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
           "WHERE n.recipientUserId = :userId AND n.isRead = false")
    int markAllAsReadByRecipientUserId(@Param("userId") UUID userId, @Param("now") Instant now);
}
