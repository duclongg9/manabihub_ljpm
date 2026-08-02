package com.manabihub.refund.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.PageResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
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
import com.manabihub.refund.dto.RefundEligibilitySnapshot;
import com.manabihub.refund.dto.request.CreateStudentRefundRequest;
import com.manabihub.refund.dto.response.StudentRefundResponse;
import com.manabihub.refund.entity.RefundRequest;
import com.manabihub.refund.enums.EligibilityResult;
import com.manabihub.refund.enums.RefundProviderStatus;
import com.manabihub.refund.enums.RefundStatus;
import com.manabihub.refund.enums.StudentRefundType;
import com.manabihub.refund.repository.RefundRequestRepository;
import com.manabihub.refund.service.StudentRefundService;
import com.manabihub.systemconfig.model.CommercialPolicy;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentRefundServiceImpl implements StudentRefundService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<RefundStatus> ACTIVE_STATUSES = List.of(
            RefundStatus.PENDING,
            RefundStatus.PROCESSING,
            RefundStatus.RECONCILIATION_REQUIRED,
            RefundStatus.APPROVED
    );

    private final StudentProfileRepository studentProfileRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemSnapshotRepository orderItemSnapshotRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CommercialPolicyService commercialPolicyService;
    private final LearningProgressDomainService learningProgressDomainService;

    @Override
    @Transactional
    public StudentRefundResponse createRefundRequest(
            UUID userId,
            CreateStudentRefundRequest request
    ) {
        StudentProfile student = requireStudent(userId);

        // Lock the order item so two concurrent submissions serialize before the active-request check.
        OrderItem orderItem = orderItemRepository.findByIdForRefundUpdate(request.orderItemId())
                .orElseThrow(this::refundTargetNotFound);
        Order order = orderItem.getOrder();
        if (!order.getStudent().getId().equals(student.getId())) {
            throw refundTargetNotFound();
        }
        if (order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException(
                    MessageCodes.REFUND_NOT_ELIGIBLE,
                    "Only a paid purchase can be submitted for refund"
            );
        }

        RefundRequest active = refundRequestRepository
                .findFirstByOrderItem_IdAndStatusInOrderByCreatedAtDesc(
                        orderItem.getId(),
                        ACTIVE_STATUSES
                )
                .orElse(null);
        if (active != null) {
            // Repeated submission while still pending is idempotent.
            if (active.getStatus() == RefundStatus.PENDING) {
                return toStudentResponse(active);
            }
            throw new BusinessException(
                    MessageCodes.REFUND_ACTIVE_REQUEST_EXISTS,
                    "This purchase already has an active or approved refund",
                    HttpStatus.CONFLICT
            );
        }

        CommercialPolicy policy = commercialPolicyService.getCurrentPolicy();
        PaymentTransaction payment = paymentTransactionRepository
                .findFirstByOrder_IdAndSucceededAtIsNotNullOrderBySucceededAtDesc(order.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.REFUND_NOT_ELIGIBLE,
                        "No confirmed payment was found for this purchase"
                ));
        Instant paymentSucceededAt = payment.getSucceededAt();
        Instant requestedAt = Instant.now();
        int elapsedDays = Math.toIntExact(ChronoUnit.DAYS.between(
                paymentSucceededAt.atZone(BUSINESS_ZONE).toLocalDate(),
                requestedAt.atZone(BUSINESS_ZONE).toLocalDate()
        ));

        OrderItemSnapshot financialSnapshot = orderItemSnapshotRepository
                .findByOrderItem_Id(orderItem.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_BAD_REQUEST,
                        "Immutable order-item financial snapshot is missing"
                ));

        var enrollment = enrollmentRepository
                .findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId());
        LearningProgressDomainService.ProgressResult progress = enrollment
                .map(enrollmentRecord -> learningProgressDomainService.calculateProgress(
                        orderItem.getCourse().getId(),
                        enrollmentRecord.getId()
                ))
                .orElse(new LearningProgressDomainService.ProgressResult(0, 0, 0.0));

        EligibilityResult result;
        List<String> reasonCodes;
        if (request.refundType() == StudentRefundType.STANDARD) {
            if (enrollment.isEmpty()) {
                throw new BusinessException(
                        MessageCodes.REFUND_ENROLLMENT_MISSING,
                        "Course access is missing; submit a platform-access exception for manual review",
                        HttpStatus.UNPROCESSABLE_ENTITY
                );
            }
            if (elapsedDays < 0 || elapsedDays > policy.refundWindowDays()) {
                throw new BusinessException(
                        MessageCodes.REFUND_WINDOW_EXPIRED,
                        "The standard refund window has expired",
                        HttpStatus.UNPROCESSABLE_ENTITY
                );
            }
            // Policy is strictly below the threshold: exactly 30% is not eligible.
            if (Double.compare(progress.percent(), policy.refundProgressLimitPercent()) >= 0) {
                throw new BusinessException(
                        MessageCodes.REFUND_PROGRESS_LIMIT_REACHED,
                        "Learning progress has reached the standard-refund threshold",
                        HttpStatus.UNPROCESSABLE_ENTITY
                );
            }
            result = EligibilityResult.STANDARD_ELIGIBLE;
            reasonCodes = List.of(
                    "PAYMENT_CONFIRMED",
                    "WITHIN_REFUND_WINDOW",
                    "PROGRESS_BELOW_THRESHOLD",
                    "NO_ACTIVE_REFUND"
            );
        } else {
            result = EligibilityResult.MANUAL_REVIEW_REQUIRED;
            reasonCodes = List.of(
                    "MANUAL_EXCEPTION_" + request.refundType().name(),
                    enrollment.isEmpty() ? "ENROLLMENT_MISSING" : "ENROLLMENT_PRESENT"
            );
        }

        RefundEligibilitySnapshot snapshot = RefundEligibilitySnapshot.builder()
                .snapshotVersion("v2")
                .policyVersion(policy.policyVersion())
                .refundType(request.refundType())
                .paymentSucceededAt(paymentSucceededAt)
                .requestedAt(requestedAt)
                .timezone(BUSINESS_ZONE.getId())
                .elapsedCalendarDays(elapsedDays)
                .refundWindowDays(policy.refundWindowDays())
                .progressCompleted(progress.completed())
                .progressTotal(progress.total())
                .measuredProgressPercent(progress.percent())
                .progressThresholdPercent(policy.refundProgressLimitPercent())
                .actuallyPaidAmount(financialSnapshot.getGrossAmount())
                .currency(financialSnapshot.getCurrency())
                .orderId(order.getId())
                .orderItemId(orderItem.getId())
                .courseId(orderItem.getCourse().getId())
                .eligible(result == EligibilityResult.STANDARD_ELIGIBLE)
                .result(result.name())
                .eligibilityResult(result)
                .reasonCodes(reasonCodes)
                .build();

        RefundRequest refund = RefundRequest.builder()
                .order(order)
                .orderItem(orderItem)
                .student(student)
                .status(RefundStatus.PENDING)
                .reason(request.reason().trim())
                .eligibilitySnapshot(snapshot)
                .build();
        return toStudentResponse(refundRequestRepository.saveAndFlush(refund));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StudentRefundResponse> getMyRefundRequests(
            UUID userId,
            Pageable pageable
    ) {
        StudentProfile student = requireStudent(userId);
        return PageResponse.from(
                refundRequestRepository.findByStudent_Id(student.getId(), pageable)
                        .map(this::toStudentResponse)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public StudentRefundResponse getMyRefundDetail(UUID userId, UUID refundId) {
        StudentProfile student = requireStudent(userId);
        return refundRequestRepository.findByIdAndStudent_Id(refundId, student.getId())
                .map(this::toStudentResponse)
                .orElseThrow(this::refundRequestNotFound);
    }

    @Override
    @Transactional
    public StudentRefundResponse cancelRefundRequest(UUID userId, UUID refundId) {
        StudentProfile student = requireStudent(userId);
        RefundRequest refund = refundRequestRepository
                .findByIdAndStudentIdForUpdate(refundId, student.getId())
                .orElseThrow(this::refundRequestNotFound);
        if (!isCancellable(refund)) {
            throw new BusinessException(
                    MessageCodes.REFUND_CANCELLATION_NOT_ALLOWED,
                    "Finance review has started or the request is no longer pending",
                    HttpStatus.CONFLICT
            );
        }
        refund.setStatus(RefundStatus.CANCELLED);
        return toStudentResponse(refundRequestRepository.save(refund));
    }

    private StudentProfile requireStudent(UUID userId) {
        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found",
                        HttpStatus.NOT_FOUND
                ));
    }

    private StudentRefundResponse toStudentResponse(RefundRequest refund) {
        OrderItem item = refund.getOrderItem();
        RefundEligibilitySnapshot snapshot = refund.getEligibilitySnapshot();
        return new StudentRefundResponse(
                refund.getId(),
                refund.getOrder().getId(),
                refund.getOrder().getOrderCode(),
                item == null ? null : item.getId(),
                item == null ? null : item.getCourse().getId(),
                item == null ? null : item.getCourse().getTitle(),
                refund.getStatus(),
                snapshot == null ? null : snapshot.getRefundType(),
                refund.getReason(),
                snapshot,
                refund.getDecisionReasonCode() == null
                        ? null
                        : refund.getDecisionReasonCode().name(),
                refund.getDecisionNote(),
                refund.getDecidedAt(),
                isCancellable(refund),
                refund.getCreatedAt(),
                refund.getUpdatedAt()
        );
    }

    private boolean isCancellable(RefundRequest refund) {
        return refund.getStatus() == RefundStatus.PENDING
                && refund.getDecidedAt() == null
                && refund.getDecidedBy() == null
                && refund.getProviderStatus() == RefundProviderStatus.NOT_REQUESTED;
    }

    private BusinessException refundTargetNotFound() {
        return new BusinessException(
                MessageCodes.COMMON_NOT_FOUND,
                "Refundable purchase item not found",
                HttpStatus.NOT_FOUND
        );
    }

    private BusinessException refundRequestNotFound() {
        return new BusinessException(
                MessageCodes.REFUND_REQUEST_NOT_FOUND,
                "Refund request not found",
                HttpStatus.NOT_FOUND
        );
    }
}
