package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository("kycNotificationRepository")
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
}
