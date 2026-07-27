package com.manabihub.notification.service.impl;

import com.manabihub.common.mail.EmailService;
import com.manabihub.notification.entity.Notification;
import com.manabihub.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationServiceImpl service;

    @Test
    void createNotificationForAdminRole_ShouldAddressInternalAdminAccounts() {
        UUID firstAdminId = UUID.randomUUID();
        UUID secondAdminId = UUID.randomUUID();
        when(notificationRepository.findActiveAdminIdsByRoleCode("COURSE_MANAGER"))
                .thenReturn(List.of(firstAdminId, secondAdminId));

        service.createNotificationForAdminRole(
                "COURSE_MANAGER",
                "Course submitted for review",
                "A course is waiting for review.",
                "COURSE_REVIEW",
                "/admin/courses/approvals/course-id"
        );

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<Notification>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(notificationRepository).saveAll(captor.capture());
        List<Notification> saved = ((List<Notification>) captor.getValue());

        assertEquals(List.of(firstAdminId, secondAdminId),
                saved.stream().map(Notification::getRecipientAdminId).toList());
        assertNull(saved.getFirst().getRecipientUserId());
        assertEquals("/admin/courses/approvals/course-id", saved.getFirst().getActionUrl());
    }
}
