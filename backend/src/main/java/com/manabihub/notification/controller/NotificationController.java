package com.manabihub.notification.controller;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.notification.dto.NotificationResponse;
import com.manabihub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> listNotifications(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<NotificationResponse> result = notificationService.listMyNotifications(
                userId, type, isRead, PageRequest.of(page, size));

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @RequestHeader("X-User-Id") UUID userId) {

        long count = notificationService.countUnread(userId);

        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {

        NotificationResponse response = notificationService.markAsRead(id, userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(
            @RequestHeader("X-User-Id") UUID userId) {

        int count = notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(ApiResponse.success(Map.of("updatedCount", count)));
    }

    @PostMapping("/test-email")
    public ResponseEntity<ApiResponse<String>> testEmail(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam String targetEmail) {

        notificationService.createNotification(
                userId,
                targetEmail,
                "Chúc mừng! Tính năng gửi Mail đã hoạt động!",
                "Đây là email tự động gửi từ máy chủ Spring Boot ManabiHub. Nếu bạn nhận được thư này nghĩa là kết nối SMTP đã được cấu hình thành công! Bạn có thể chuyển sang bước tiếp theo.",
                "SYSTEM"
        );

        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu gửi mail thành công!"));
    }
}
