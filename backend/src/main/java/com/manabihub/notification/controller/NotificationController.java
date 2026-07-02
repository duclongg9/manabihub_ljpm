package com.manabihub.notification.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.notification.dto.NotificationResponse;
import com.manabihub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

        private final NotificationService notificationService;

        /**
         * GET /api/v1/notifications?type=KYC&isRead=false&page=0&size=10
         * <p>
         * Lists notifications for the authenticated user with optional filters.
         * Supports pagination (NFR-PERF-16: load within 2 seconds).
         */
        @GetMapping
        public ResponseEntity<ApiResponse<Page<NotificationResponse>>> listNotifications(
                        @RequestHeader("X-User-Id") UUID userId,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) Boolean isRead,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Pageable pageable = PageRequest.of(page, size);
                Page<NotificationResponse> result = notificationService
                                .listMyNotifications(userId, type, isRead, pageable);

                return ResponseEntity.ok(
                                ApiResponse.success(MessageCodes.COMMON_SUCCESS,
                                                "Notifications retrieved successfully", result));
        }

        /**
         * GET /api/v1/notifications/unread-count
         * <p>
         * Returns the number of unread notifications (for bell icon badge).
         */
        @GetMapping("/unread-count")
        public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
                        @RequestHeader("X-User-Id") UUID userId) {

                long count = notificationService.countUnread(userId);

                return ResponseEntity.ok(
                                ApiResponse.success(MessageCodes.COMMON_SUCCESS,
                                                "Unread count retrieved", Map.of("unreadCount", count)));
        }

        /**
         * PATCH /api/v1/notifications/{id}/read
         * <p>
         * Marks a single notification as read.
         */
        @PatchMapping("/{id}/read")
        public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
                        @PathVariable UUID id,
                        @RequestHeader("X-User-Id") UUID userId) {

                NotificationResponse result = notificationService.markAsRead(id, userId);

                return ResponseEntity.ok(
                                ApiResponse.success(MessageCodes.NOTIFICATION_MARKED_READ,
                                                "Notification marked as read", result));
        }

        /**
         * PATCH /api/v1/notifications/read-all
         * <p>
         * Marks all unread notifications as read for the authenticated user.
         */
        @PatchMapping("/read-all")
        public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(
                        @RequestHeader("X-User-Id") UUID userId) {

                int count = notificationService.markAllAsRead(userId);

                return ResponseEntity.ok(
                                ApiResponse.success(MessageCodes.NOTIFICATION_MARKED_READ,
                                                "All notifications marked as read",
                                                Map.of("markedCount", count)));
        }

        @org.springframework.beans.factory.annotation.Autowired
        private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

        /**
         * API Test Gửi Mail
         * TODO: Xóa đi trước khi đưa lên Production
         */
        @GetMapping("/test-email")
        public ResponseEntity<ApiResponse<Void>> testSendEmail(
                        @RequestParam String targetEmail) {

                // Lấy 1 ID có sẵn để qua mặt khóa ngoại DB
                java.util.List<UUID> ids = jdbcTemplate.queryForList("SELECT id FROM app_users LIMIT 1", UUID.class);
                if (ids.isEmpty()) {
                        throw new RuntimeException("No users found in database");
                }
                UUID userId = ids.get(0);

                notificationService.createNotification(
                                userId,
                                targetEmail,
                                "Xin chào từ ManabiHub!",
                                "Nếu bạn nhận được email này, chứng tỏ bạn gay!",
                                "SYSTEM");

                return ResponseEntity.ok(
                                ApiResponse.success(MessageCodes.COMMON_SUCCESS,
                                                "Đã gửi 1 email test thành công tới: " + targetEmail));
        }
}
