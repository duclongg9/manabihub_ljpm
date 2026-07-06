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

@Repository("coreNotificationRepository")
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM SysNotification n WHERE (n.recipientUserId = :userId OR n.recipientAdminId = :userId) ORDER BY n.createdAt DESC")
    Page<Notification> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM SysNotification n WHERE (n.recipientUserId = :userId OR n.recipientAdminId = :userId) AND n.isRead = :isRead ORDER BY n.createdAt DESC")
    Page<Notification> findAllByUserIdAndIsReadOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("isRead") boolean isRead, Pageable pageable);

    @Query("SELECT n FROM SysNotification n WHERE (n.recipientUserId = :userId OR n.recipientAdminId = :userId) AND n.notificationType = :notificationType ORDER BY n.createdAt DESC")
    Page<Notification> findAllByUserIdAndNotificationTypeOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("notificationType") String notificationType, Pageable pageable);

    @Query("SELECT n FROM SysNotification n WHERE (n.recipientUserId = :userId OR n.recipientAdminId = :userId) AND n.notificationType = :notificationType AND n.isRead = :isRead ORDER BY n.createdAt DESC")
    Page<Notification> findAllByUserIdAndTypeAndIsReadOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("notificationType") String notificationType, @Param("isRead") boolean isRead, Pageable pageable);

    @Query("SELECT COUNT(n) FROM SysNotification n WHERE (n.recipientUserId = :userId OR n.recipientAdminId = :userId) AND n.isRead = false")
    long countUnreadByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE SysNotification n SET n.isRead = true, n.readAt = :now " +
           "WHERE (n.recipientUserId = :userId OR n.recipientAdminId = :userId) AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") UUID userId, @Param("now") Instant now);
}
