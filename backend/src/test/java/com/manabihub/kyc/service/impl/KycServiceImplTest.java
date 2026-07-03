package com.manabihub.kyc.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.User;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.kyc.dto.request.KycReviewRequest;
import com.manabihub.kyc.dto.response.KycRequestResponse;
import com.manabihub.kyc.entity.KycRequest;
import com.manabihub.kyc.enums.KycStatus;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.notification.entity.Notification;
import com.manabihub.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycServiceImplTest {

    @Mock
    private KycRequestRepository kycRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private KycServiceImpl kycService;

    private User courseManager;
    private User financeManager;
    private User teacher;
    private KycRequest pendingKycRequest;
    private UUID kycId;

    @BeforeEach
    void setUp() {
        kycId = UUID.randomUUID();

        courseManager = User.builder()
                .id(UUID.randomUUID())
                .email("manager@manabihub.local")
                .role("COURSE_MANAGER")
                .build();

        financeManager = User.builder()
                .id(UUID.randomUUID())
                .email("finance@manabihub.local")
                .role("FINANCE_MANAGER")
                .build();

        teacher = User.builder()
                .id(UUID.randomUUID())
                .email("teacher@manabihub.local")
                .role("STUDENT")
                .build();

        pendingKycRequest = KycRequest.builder()
                .id(kycId)
                .teacher(teacher)
                .status(KycStatus.PENDING_ADMIN_REVIEW)
                .displayName("Teacher Name")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // 1. Test Phân Quyền (RBAC) - Khác hệ Course Manager thì ném lỗi
    @Test
    void testReviewKyc_WhenFinanceManager_ShouldThrowException() {
        when(userRepository.findById(financeManager.getId())).thenReturn(Optional.of(financeManager));

        KycReviewRequest request = new KycReviewRequest(KycStatus.APPROVED, "OK");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, financeManager.getId())
        );

        assertEquals("COURSE_MANAGER_REQUIRED", exception.getMessageCode());
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        verify(kycRequestRepository, never()).save(any());
    }

    // 2. Test Lỗi Validation - Từ chối nhưng bỏ trống lý do
    @Test
    void testReviewKyc_WhenRejectWithoutNote_ShouldThrowException() {
        when(userRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(pendingKycRequest));

        KycReviewRequest request = new KycReviewRequest(KycStatus.REJECTED, "   "); // Ghi chú rỗng

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, courseManager.getId())
        );

        assertEquals("VALIDATION_FAILED", exception.getMessageCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(kycRequestRepository, never()).save(any());
    }

    // 3. Test Luồng Thành Công - Khi phê duyệt hồ sơ
    @Test
    void testReviewKyc_WhenApprove_ShouldSaveAllEntitiesAndUpgradeRole() {
        when(userRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(pendingKycRequest));
        when(kycRequestRepository.save(any(KycRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        KycReviewRequest request = new KycReviewRequest(KycStatus.APPROVED, "Looks good");

        KycRequestResponse response = kycService.reviewKyc(kycId, request, courseManager.getId());

        // Kiểm tra thay đổi trạng thái
        assertNotNull(response);
        assertEquals(KycStatus.APPROVED, response.getStatus());

        // Quan trọng: Kiểm tra xem giáo viên đã được cấp quyền TEACHER chưa
        assertEquals("TEACHER", teacher.getRole());
        verify(userRepository).save(teacher);

        // Kiểm tra xem Audit Log và Notification đã được gọi để lưu trữ hay chưa
        verify(auditLogRepository).save(any(AuditLog.class));
        verify(notificationRepository).save(any(Notification.class));
    }
    
    // 4. Test Trạng thái xung đột - Hồ sơ không ở trạng thái Chờ duyệt
    @Test
    void testReviewKyc_WhenStatusNotPending_ShouldThrowConflict() {
        when(userRepository.findById(courseManager.getId())).thenReturn(Optional.of(courseManager));
        
        KycRequest approvedRequest = KycRequest.builder()
                .id(kycId)
                .status(KycStatus.APPROVED)
                .build();
        when(kycRequestRepository.findById(kycId)).thenReturn(Optional.of(approvedRequest));

        KycReviewRequest request = new KycReviewRequest(KycStatus.REJECTED, "Bad");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                kycService.reviewKyc(kycId, request, courseManager.getId())
        );

        assertEquals("COMMON_CONFLICT", exception.getMessageCode());
        verify(auditLogRepository, never()).save(any()); // Đảm bảo không ghi log sai
    }
}
