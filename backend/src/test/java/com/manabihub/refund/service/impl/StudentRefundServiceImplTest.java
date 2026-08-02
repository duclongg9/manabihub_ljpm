package com.manabihub.refund.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.service.LearningProgressDomainService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.entity.OrderItemSnapshot;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderItemSnapshotRepository;
import com.manabihub.payment.entity.PaymentTransaction;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.refund.dto.request.CreateStudentRefundRequest;
import com.manabihub.refund.entity.RefundRequest;
import com.manabihub.refund.enums.EligibilityResult;
import com.manabihub.refund.enums.RefundProviderStatus;
import com.manabihub.refund.enums.RefundStatus;
import com.manabihub.refund.enums.StudentRefundType;
import com.manabihub.refund.repository.RefundRequestRepository;
import com.manabihub.systemconfig.model.CommercialPolicy;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRefundServiceImplTest {

    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private RefundRequestRepository refundRequestRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private OrderItemSnapshotRepository orderItemSnapshotRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private CommercialPolicyService commercialPolicyService;
    @Mock private LearningProgressDomainService learningProgressDomainService;

    @InjectMocks private StudentRefundServiceImpl service;

    private UUID userId;
    private StudentProfile student;
    private Order order;
    private OrderItem orderItem;
    private Enrollment enrollment;
    private PaymentTransaction payment;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        student = new StudentProfile();
        student.setId(UUID.randomUUID());
        student.setUser(user);

        order = new Order();
        order.setId(UUID.randomUUID());
        order.setStudent(student);
        order.setOrderCode("MHB-TEST");
        order.setStatus(OrderStatus.PAID);

        Course course = new Course();
        course.setId(UUID.randomUUID());
        course.setTitle("N2");
        orderItem = new OrderItem();
        orderItem.setId(UUID.randomUUID());
        orderItem.setOrder(order);
        orderItem.setCourse(course);

        enrollment = new Enrollment();
        enrollment.setId(UUID.randomUUID());
        payment = PaymentTransaction.builder()
                .order(order)
                .succeededAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();
    }

    @Test
    void standardRefund_exactlyThirtyPercent_isIneligible() {
        stubCommon(StudentRefundType.STANDARD);
        when(learningProgressDomainService.calculateProgress(orderItem.getCourse().getId(), enrollment.getId()))
                .thenReturn(new LearningProgressDomainService.ProgressResult(3, 10, 30.0));

        BusinessException error = assertThrows(BusinessException.class, () ->
                service.createRefundRequest(userId, request(StudentRefundType.STANDARD)));

        assertEquals(MessageCodes.REFUND_PROGRESS_LIMIT_REACHED, error.getMessageCode());
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, error.getHttpStatus());
        verify(refundRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void standardRefund_daySevenAnd2999Percent_createsPendingSnapshot() {
        payment.setSucceededAt(Instant.now().minus(7, ChronoUnit.DAYS));
        stubCommon(StudentRefundType.STANDARD);
        when(learningProgressDomainService.calculateProgress(orderItem.getCourse().getId(), enrollment.getId()))
                .thenReturn(new LearningProgressDomainService.ProgressResult(2999, 10000, 29.99));
        when(refundRequestRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            RefundRequest saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var response = service.createRefundRequest(userId, request(StudentRefundType.STANDARD));

        assertEquals(RefundStatus.PENDING, response.status());
        assertEquals(EligibilityResult.STANDARD_ELIGIBLE,
                response.eligibilitySnapshot().getEligibilityResult());
        assertTrue(response.cancellable());
        assertEquals(new BigDecimal("799000"),
                response.eligibilitySnapshot().getActuallyPaidAmount());
    }

    @Test
    void platformAccessFailure_withoutEnrollment_routesToManualReview() {
        stubIdentityAndPurchase();
        when(commercialPolicyService.getCurrentPolicy()).thenReturn(policy());
        when(paymentTransactionRepository
                .findFirstByOrder_IdAndSucceededAtIsNotNullOrderBySucceededAtDesc(order.getId()))
                .thenReturn(Optional.of(payment));
        when(orderItemSnapshotRepository.findByOrderItem_Id(orderItem.getId()))
                .thenReturn(Optional.of(financialSnapshot()));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId()))
                .thenReturn(Optional.empty());
        when(refundRequestRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createRefundRequest(
                userId,
                request(StudentRefundType.PLATFORM_ACCESS_FAILURE)
        );

        assertEquals(EligibilityResult.MANUAL_REVIEW_REQUIRED,
                response.eligibilitySnapshot().getEligibilityResult());
        assertFalse(response.eligibilitySnapshot().getEligible());
        assertEquals(0, response.eligibilitySnapshot().getProgressTotal());
    }

    @Test
    void repeatedPendingSubmission_returnsExistingRequestIdempotently() {
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        when(orderItemRepository.findByIdForRefundUpdate(orderItem.getId()))
                .thenReturn(Optional.of(orderItem));
        RefundRequest existing = RefundRequest.builder()
                .id(UUID.randomUUID())
                .order(order)
                .orderItem(orderItem)
                .student(student)
                .status(RefundStatus.PENDING)
                .providerStatus(RefundProviderStatus.NOT_REQUESTED)
                .reason("existing")
                .build();
        when(refundRequestRepository.findFirstByOrderItem_IdAndStatusInOrderByCreatedAtDesc(
                eq(orderItem.getId()), anyList())).thenReturn(Optional.of(existing));

        var response = service.createRefundRequest(userId, request(StudentRefundType.STANDARD));

        assertEquals(existing.getId(), response.id());
        verify(commercialPolicyService, never()).getCurrentPolicy();
    }

    @Test
    void detailForAnotherStudent_isHiddenAsNotFound() {
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        UUID refundId = UUID.randomUUID();
        when(refundRequestRepository.findByIdAndStudent_Id(refundId, student.getId()))
                .thenReturn(Optional.empty());

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.getMyRefundDetail(userId, refundId));

        assertEquals(MessageCodes.REFUND_REQUEST_NOT_FOUND, error.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, error.getHttpStatus());
    }

    @Test
    void cancelAfterFinanceDecisionStarted_isRejected() {
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        RefundRequest refund = RefundRequest.builder()
                .id(UUID.randomUUID())
                .student(student)
                .order(order)
                .orderItem(orderItem)
                .status(RefundStatus.PENDING)
                .providerStatus(RefundProviderStatus.NOT_REQUESTED)
                .decidedAt(Instant.now())
                .reason("reason")
                .build();
        when(refundRequestRepository.findByIdAndStudentIdForUpdate(refund.getId(), student.getId()))
                .thenReturn(Optional.of(refund));

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.cancelRefundRequest(userId, refund.getId()));

        assertEquals(MessageCodes.REFUND_CANCELLATION_NOT_ALLOWED, error.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, error.getHttpStatus());
    }

    private void stubCommon(StudentRefundType type) {
        stubIdentityAndPurchase();
        when(commercialPolicyService.getCurrentPolicy()).thenReturn(policy());
        when(paymentTransactionRepository
                .findFirstByOrder_IdAndSucceededAtIsNotNullOrderBySucceededAtDesc(order.getId()))
                .thenReturn(Optional.of(payment));
        when(orderItemSnapshotRepository.findByOrderItem_Id(orderItem.getId()))
                .thenReturn(Optional.of(financialSnapshot()));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId()))
                .thenReturn(Optional.of(enrollment));
    }

    private void stubIdentityAndPurchase() {
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        when(orderItemRepository.findByIdForRefundUpdate(orderItem.getId()))
                .thenReturn(Optional.of(orderItem));
        when(refundRequestRepository.findFirstByOrderItem_IdAndStatusInOrderByCreatedAtDesc(
                eq(orderItem.getId()), anyList())).thenReturn(Optional.empty());
    }

    private CreateStudentRefundRequest request(StudentRefundType type) {
        return new CreateStudentRefundRequest(orderItem.getId(), type, "Please review this purchase");
    }

    private CommercialPolicy policy() {
        return new CommercialPolicy(
                "VND",
                new BigDecimal("0.20"),
                7,
                30,
                14,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                1,
                3,
                "policy-v1",
                Instant.parse("2026-01-01T00:00:00Z")
        );
    }

    private OrderItemSnapshot financialSnapshot() {
        return OrderItemSnapshot.builder()
                .grossAmount(new BigDecimal("799000"))
                .currency("VND")
                .build();
    }
}
