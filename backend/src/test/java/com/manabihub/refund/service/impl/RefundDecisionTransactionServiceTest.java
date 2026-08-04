package com.manabihub.refund.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.entity.Role;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.enums.RoleCode;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.entity.OrderItemSnapshot;
import com.manabihub.order.enums.OrderItemRefundStatus;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderItemSnapshotRepository;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.payment.entity.PaymentTransaction;
import com.manabihub.payment.enums.PaymentStatus;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.refund.dto.request.RefundDecisionRequest;
import com.manabihub.refund.entity.RefundProviderAttempt;
import com.manabihub.refund.entity.RefundRequest;
import com.manabihub.refund.enums.EligibilityResult;
import com.manabihub.refund.enums.RefundDecisionReason;
import com.manabihub.refund.enums.RefundProviderStatus;
import com.manabihub.refund.enums.RefundSettlementMethod;
import com.manabihub.refund.enums.RefundSettlementStatus;
import com.manabihub.refund.enums.RefundStatus;
import com.manabihub.refund.enums.StudentRefundType;
import com.manabihub.refund.gateway.RefundGatewayResult;
import com.manabihub.refund.repository.RefundProviderAttemptRepository;
import com.manabihub.refund.repository.RefundRequestRepository;
import com.manabihub.refund.service.RefundAfterCommitNotifier;
import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.service.StudentWalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RefundDecisionTransactionServiceTest {

    @Mock
    private RefundRequestRepository refundRequestRepository;
    @Mock
    private RefundProviderAttemptRepository attemptRepository;
    @Mock
    private InternalAdminAccountRepository adminAccountRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private OrderItemSnapshotRepository snapshotRepository;
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private EscrowLedgerRepository escrowLedgerRepository;
    @Mock
    private EscrowService escrowService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private RefundAfterCommitNotifier afterCommitNotifier;
    @Mock
    private StudentWalletService studentWalletService;

    @InjectMocks
    private RefundDecisionTransactionService service;

    private UUID adminId;
    private RefundRequest refund;
    private Order order;
    private OrderItem refundedItem;
    private OrderItem otherItem;
    private PaymentTransaction payment;
    private Enrollment enrollment;
    private RefundProviderAttempt attempt;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        InternalAdminAccount admin = financeAdmin(adminId);
        when(adminAccountRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(adminAccountRepository.hasPermission(adminId, "REFUND_REVIEW"))
                .thenReturn(true);

        StudentProfile student = student();
        Course course = course();
        order = Order.builder()
                .id(UUID.randomUUID())
                .student(student)
                .orderCode("ORD-REFUND-001")
                .totalAmount(money("1500000"))
                .currency("VND")
                .status(OrderStatus.PAID)
                .build();
        refundedItem = OrderItem.builder()
                .id(UUID.randomUUID())
                .order(order)
                .course(course)
                .price(money("1000000"))
                .refundStatus(OrderItemRefundStatus.NOT_REFUNDED)
                .build();
        otherItem = OrderItem.builder()
                .id(UUID.randomUUID())
                .order(order)
                .course(course)
                .price(money("500000"))
                .refundStatus(OrderItemRefundStatus.NOT_REFUNDED)
                .build();
        refund = RefundRequest.builder()
                .id(UUID.randomUUID())
                .order(order)
                .orderItem(refundedItem)
                .student(student)
                .status(RefundStatus.PENDING)
                .providerStatus(RefundProviderStatus.NOT_REQUESTED)
                .reason("Platform access failure")
                .eligibilitySnapshot(com.manabihub.refund.dto.RefundEligibilitySnapshot.builder()
                        .orderId(order.getId())
                        .orderItemId(refundedItem.getId())
                        .actuallyPaidAmount(money("1000000"))
                        .policyVersion("refund-policy-v1")
                        .paymentSucceededAt(java.time.Instant.parse("2026-07-20T00:00:00Z"))
                        .requestedAt(java.time.Instant.parse("2026-07-21T00:00:00Z"))
                        .measuredProgressPercent(10.0)
                        .refundType(StudentRefundType.STANDARD)
                        .eligible(true)
                        .eligibilityResult(EligibilityResult.STANDARD_ELIGIBLE)
                        .build())
                .build();
        payment = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .order(order)
                .provider("VNPAY")
                .providerTransactionId("VNP-001")
                .amount(money("1500000"))
                .status(PaymentStatus.SUCCESS)
                .succeededAt(java.time.Instant.parse("2026-07-20T00:00:00Z"))
                .build();
        enrollment = Enrollment.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .status(EnrollmentStatus.ACTIVE)
                .build();
        attempt = RefundProviderAttempt.builder()
                .id(UUID.randomUUID())
                .refundRequest(refund)
                .idempotencyKey("refund:" + refund.getId())
                .providerRequestId("refund-request:" + refund.getId())
                .provider("VNPAY")
                .attemptCount(0)
                .build();

        OrderItemSnapshot financialSnapshot = OrderItemSnapshot.builder()
                .id(UUID.randomUUID())
                .orderItem(refundedItem)
                .currency("VND")
                .grossAmount(money("1000000"))
                .commissionRate(new BigDecimal("0.2000"))
                .commissionAmount(money("200000"))
                .teacherNetAmount(money("800000"))
                .commercialPolicyVersion("commercial-v1")
                .escrowDays(7)
                .build();
        EscrowLedger escrow = EscrowLedger.builder()
                .id(UUID.randomUUID())
                .order(order)
                .orderItem(refundedItem)
                .course(course)
                .teacher(course.getTeacher())
                .amount(money("800000"))
                .status(EscrowStatus.HELD)
                .build();

        when(refundRequestRepository.findByIdForUpdate(refund.getId()))
                .thenReturn(Optional.of(refund));
        when(orderRepository.findByIdForUpdate(order.getId()))
                .thenReturn(Optional.of(order));
        when(snapshotRepository.findByOrderItem_Id(refundedItem.getId()))
                .thenReturn(Optional.of(financialSnapshot));
        when(paymentTransactionRepository.findByOrder_IdAndStatusInOrderByCreatedAtAsc(
                order.getId(), List.of(PaymentStatus.SUCCESS)))
                .thenReturn(List.of(payment));
        when(escrowLedgerRepository.findByOrderItemIdForUpdate(refundedItem.getId()))
                .thenReturn(Optional.of(escrow));
        when(attemptRepository.findByRefundRequest_Id(refund.getId()))
                .thenReturn(Optional.of(attempt));
        when(attemptRepository.findByIdempotencyKey("refund:" + refund.getId()))
                .thenReturn(Optional.of(attempt));
    }

    @Test
    void requireAccessUsesLiveDatabasePermission() {
        when(adminAccountRepository.hasPermission(adminId, "REFUND_REVIEW"))
                .thenReturn(false);

        assertThrows(BusinessException.class, () -> service.requireAccess(adminId));
    }

    @Test
    void processingRequestCannotStartAnotherProviderAttempt() {
        refund.setStatus(RefundStatus.PROCESSING);

        assertThrows(
                BusinessException.class,
                () -> service.prepareApproval(
                        refund.getId(),
                        approvalDecision(),
                        adminId,
                        "VNPAY"
                )
        );

        verify(attemptRepository, never()).save(any());
    }

    @Test
    void providerFailurePersistsReconciliationWithoutFinancialMutation() {
        RefundDecisionTransactionService.PreparedApproval prepared =
                prepareApproval();

        RefundStatus outcome = service.completeApproval(
                prepared,
                RefundGatewayResult.unavailable("PROVIDER_DOWN")
        );

        assertEquals(RefundStatus.RECONCILIATION_REQUIRED, outcome);
        assertEquals(RefundStatus.RECONCILIATION_REQUIRED, refund.getStatus());
        assertEquals(RefundProviderStatus.UNAVAILABLE, refund.getProviderStatus());
        assertEquals("PROVIDER_UNAVAILABLE", refund.getReconciliationReasonCode());
        verify(escrowService, never()).reverseHeldAllocationForRefund(any());
        verify(enrollmentRepository, never()).save(any());
        verify(orderItemRepository, never()).save(any());
        verify(orderRepository, never()).save(any());
        verify(paymentTransactionRepository, never()).save(any());
        verify(afterCommitNotifier, never()).schedule(
                any(), any(), any(), any(), anyString(), anyString());
    }

    @Test
    void authenticatedProviderSuccessRefundsOnlyTheAffectedItem() {
        when(escrowService.reverseHeldAllocationForRefund(refundedItem.getId()))
                .thenReturn(true);
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(
                refund.getStudent().getId(),
                refundedItem.getCourse().getId()
        )).thenReturn(Optional.of(enrollment));
        when(orderItemRepository.findByOrder_Id(order.getId()))
                .thenReturn(List.of(refundedItem, otherItem));
        RefundDecisionTransactionService.PreparedApproval prepared =
                prepareApproval();

        RefundStatus outcome = service.completeApproval(
                prepared,
                new RefundGatewayResult(
                        RefundProviderStatus.SUCCESS,
                        true,
                        "VNP-RF-001",
                        "00",
                        "Refunded",
                        money("1000000")
                )
        );

        assertEquals(RefundStatus.APPROVED, outcome);
        assertEquals(RefundStatus.APPROVED, refund.getStatus());
        assertEquals(RefundProviderStatus.SUCCESS, refund.getProviderStatus());
        assertEquals(OrderItemRefundStatus.REFUNDED, refundedItem.getRefundStatus());
        assertEquals(EnrollmentStatus.REFUNDED, enrollment.getStatus());
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(escrowService).reverseHeldAllocationForRefund(refundedItem.getId());
        verify(orderRepository, never()).save(any());
        verify(paymentTransactionRepository, never()).save(any());
        verify(afterCommitNotifier).schedule(
                any(), any(), any(), any(), anyString(), anyString());
    }

    @Test
    void approvalCreditsFullGrossAmountToWalletWithoutCallingProvider() {
        WalletTransaction walletCredit = WalletTransaction.builder()
                .id(UUID.randomUUID())
                .build();
        when(escrowService.reverseHeldAllocationForRefund(refundedItem.getId()))
                .thenReturn(true);
        when(studentWalletService.creditRefund(
                eq(refund.getStudent().getId()),
                eq(money("1000000")),
                eq(refund.getId()),
                anyString()))
                .thenReturn(walletCredit);
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(
                refund.getStudent().getId(), refundedItem.getCourse().getId()))
                .thenReturn(Optional.of(enrollment));
        when(orderItemRepository.findByOrder_Id(order.getId()))
                .thenReturn(List.of(refundedItem, otherItem));

        RefundStatus outcome = service.approveToStudentWallet(
                refund.getId(), approvalDecision(), adminId);

        assertEquals(RefundStatus.APPROVED, outcome);
        assertEquals(RefundSettlementMethod.WALLET, refund.getSettlementMethod());
        assertEquals(RefundSettlementStatus.COMPLETED, refund.getSettlementStatus());
        assertEquals(walletCredit.getId(), refund.getWalletTransactionId());
        assertEquals(RefundProviderStatus.NOT_REQUESTED, refund.getProviderStatus());
        assertEquals(OrderItemRefundStatus.REFUNDED, refundedItem.getRefundStatus());
        assertEquals(EnrollmentStatus.REFUNDED, enrollment.getStatus());
        assertEquals(OrderStatus.PAID, order.getStatus());
        verify(studentWalletService).creditRefund(
                eq(refund.getStudent().getId()),
                eq(money("1000000")),
                eq(refund.getId()),
                anyString());
        verify(attemptRepository, never()).save(any());
    }

    @Test
    void brRef01AutoApprovalCreditsFullGrossAmountToWalletWithoutAdmin() {
        WalletTransaction walletCredit = WalletTransaction.builder()
                .id(UUID.randomUUID())
                .build();
        when(escrowService.reverseHeldAllocationForRefund(refundedItem.getId()))
                .thenReturn(true);
        when(studentWalletService.creditRefund(
                eq(refund.getStudent().getId()),
                eq(money("1000000")),
                eq(refund.getId()),
                anyString()))
                .thenReturn(walletCredit);
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(
                refund.getStudent().getId(), refundedItem.getCourse().getId()))
                .thenReturn(Optional.of(enrollment));
        when(orderItemRepository.findByOrder_Id(order.getId()))
                .thenReturn(List.of(refundedItem, otherItem));

        RefundRequest result = service.autoApproveToStudentWallet(refund.getId());

        assertEquals(refund, result);
        assertEquals(RefundStatus.APPROVED, refund.getStatus());
        assertEquals(RefundDecisionReason.STANDARD_ELIGIBLE, refund.getDecisionReasonCode());
        assertEquals("Tự động phê duyệt theo BR-REF-01", refund.getDecisionNote());
        assertEquals(null, refund.getDecidedBy());
        assertEquals(RefundSettlementMethod.WALLET, refund.getSettlementMethod());
        assertEquals(RefundSettlementStatus.COMPLETED, refund.getSettlementStatus());
        assertEquals(walletCredit.getId(), refund.getWalletTransactionId());
        verify(studentWalletService).creditRefund(
                eq(refund.getStudent().getId()),
                eq(money("1000000")),
                eq(refund.getId()),
                anyString());
        verify(auditLogService).logUserAction(
                eq(refund.getStudent().getUser().getId()),
                eq("STUDENT"),
                eq("AUTO_APPROVE_REFUND_TO_WALLET"),
                eq("REFUND_REQUEST"),
                eq(refund.getId()),
                any(),
                any(),
                any());
        verify(adminAccountRepository, never()).hasPermission(any(), anyString());
        verify(attemptRepository, never()).save(any());
    }

    @Test
    void rejectionRecordsReasonWithoutTouchingMoneyOrAccess() {
        RefundDecisionRequest decision = RefundDecisionRequest.builder()
                .reasonCode(RefundDecisionReason.OUTSIDE_REFUND_WINDOW)
                .note("Request is outside the documented refund window.")
                .build();

        service.reject(refund.getId(), decision, adminId);

        assertEquals(RefundStatus.REJECTED, refund.getStatus());
        assertEquals(
                RefundDecisionReason.OUTSIDE_REFUND_WINDOW,
                refund.getDecisionReasonCode()
        );
        assertEquals(decision.getNote(), refund.getDecisionNote());
        verify(escrowService, never()).reverseHeldAllocationForRefund(any());
        verify(enrollmentRepository, never()).save(any());
        verify(orderItemRepository, never()).save(any());
        verify(orderRepository, never()).save(any());
        verify(paymentTransactionRepository, never()).save(any());
        verify(afterCommitNotifier).schedule(
                any(), any(), any(), any(), anyString(), anyString());
    }

    @Test
    void nullProviderResultIsQuarantinedAsInvalid() {
        RefundDecisionTransactionService.PreparedApproval prepared =
                prepareApproval();

        RefundStatus outcome = service.completeApproval(prepared, null);

        assertEquals(RefundStatus.RECONCILIATION_REQUIRED, outcome);
        assertEquals(RefundProviderStatus.INVALID_RESULT, refund.getProviderStatus());
        assertEquals(
                "PROVIDER_INVALID_RESULT",
                refund.getReconciliationReasonCode()
        );
        assertTrue(attempt.getResultCode().contains("MISSING"));
        verify(escrowService, never()).reverseHeldAllocationForRefund(any());
    }

    private RefundDecisionTransactionService.PreparedApproval prepareApproval() {
        return service.prepareApproval(
                refund.getId(),
                approvalDecision(),
                adminId,
                "VNPAY"
        );
    }

    private RefundDecisionRequest approvalDecision() {
        return RefundDecisionRequest.builder()
                .reasonCode(RefundDecisionReason.STANDARD_ELIGIBLE)
                .note("Eligibility snapshot and payment evidence verified.")
                .build();
    }

    private InternalAdminAccount financeAdmin(UUID id) {
        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setCode(RoleCode.FINANCE_MANAGER);
        role.setName("Finance Manager");
        InternalAdminAccount admin = new InternalAdminAccount();
        admin.setId(id);
        admin.setEmail("finance@manabihub.test");
        admin.setFullName("Finance Reviewer");
        admin.setPasswordHash("unused");
        admin.setRole(role);
        return admin;
    }

    private StudentProfile student() {
        AppUser user = AppUser.builder()
                .id(UUID.randomUUID())
                .email("student@manabihub.test")
                .fullName("Student")
                .build();
        return StudentProfile.builder()
                .id(UUID.randomUUID())
                .user(user)
                .displayName("Student")
                .build();
    }

    private Course course() {
        com.manabihub.kyc.domain.AppUser teacherUser =
                new com.manabihub.kyc.domain.AppUser();
        teacherUser.setId(UUID.randomUUID());
        teacherUser.setEmail("teacher@manabihub.test");
        teacherUser.setFullName("Teacher");
        TeacherProfile teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(teacherUser);
        return Course.builder()
                .id(UUID.randomUUID())
                .teacher(teacher)
                .title("Refund-safe course")
                .slug("refund-safe-course")
                .price(money("1000000"))
                .currency("VND")
                .build();
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
