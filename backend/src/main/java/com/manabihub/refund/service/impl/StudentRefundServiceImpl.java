package com.manabihub.refund.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.PageResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.service.LearningProgressDomainService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.entity.OrderItemSnapshot;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderItemSnapshotRepository;
import com.manabihub.payment.entity.PaymentTransaction;
import com.manabihub.payment.enums.PaymentStatus;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.refund.dto.RefundEligibilitySnapshot;
import com.manabihub.refund.dto.request.CreateStudentRefundRequest;
import com.manabihub.refund.dto.response.RefundDetailResponse;
import com.manabihub.refund.dto.response.RefundQueueResponse;
import com.manabihub.refund.entity.RefundRequest;
import com.manabihub.refund.enums.EligibilityResult;
import com.manabihub.refund.enums.RefundStatus;
import com.manabihub.refund.enums.StudentRefundType;
import com.manabihub.refund.mapper.RefundMapper;
import com.manabihub.refund.repository.RefundRequestRepository;
import com.manabihub.refund.service.StudentRefundService;
import com.manabihub.systemconfig.model.CommercialPolicy;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
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
@Slf4j
public class StudentRefundServiceImpl implements StudentRefundService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final StudentProfileRepository studentProfileRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemSnapshotRepository orderItemSnapshotRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CommercialPolicyService commercialPolicyService;
    private final LearningProgressDomainService learningProgressDomainService;
    private final RefundMapper refundMapper;

    @Override
    @Transactional
    public RefundDetailResponse createRefundRequest(UUID userId, CreateStudentRefundRequest request) {
        StudentProfile student = getStudentProfile(userId);
        OrderItem orderItem = orderItemRepository.findById(request.orderItemId())
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Order item not found"));
        Order order = orderItem.getOrder();

        if (!order.getStudent().getId().equals(student.getId())) {
            throw new BusinessException(MessageCodes.AUTH_FORBIDDEN, "Not authorized to refund this course", HttpStatus.FORBIDDEN);
        }

        // Get commercial policy config
        CommercialPolicy policy = commercialPolicyService.getCurrentPolicy();
        int refundWindowDays = policy.refundWindowDays();
        int progressLimitPercent = policy.refundProgressLimitPercent();

        // Get Payment info (MHB-41: authoritative payment time)
        PaymentTransaction payment = paymentTransactionRepository.findFirstByOrder_IdAndStatusInOrderByUpdatedAtDesc(
                order.getId(),
                List.of(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)
        ).orElseThrow(() -> new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "No successful payment found for this order"));

        Instant paymentTime = payment.getUpdatedAt();
        Instant requestTime = Instant.now();
        int elapsedDays = (int) ChronoUnit.DAYS.between(paymentTime.atZone(BUSINESS_ZONE).toLocalDate(), requestTime.atZone(BUSINESS_ZONE).toLocalDate());

        // Get snapshot (MHB-74: immutable commercial data)
        OrderItemSnapshot orderItemSnapshot = orderItemSnapshotRepository.findByOrderItem_Id(orderItem.getId())
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "Financial snapshot not found"));

        // Get Enrollment for learning progress
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId())
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "Enrollment not found for this course"));
        LearningProgressDomainService.ProgressResult progress = learningProgressDomainService.calculateProgress(orderItem.getCourse().getId(), enrollment.getId());

        EligibilityResult eligibilityResult = EligibilityResult.STANDARD_ELIGIBLE;
        
        if (request.refundType() == StudentRefundType.STANDARD) {
            if (elapsedDays > refundWindowDays) {
                throw new BusinessException(MessageCodes.REFUND_NOT_ELIGIBLE, "Refund window has expired");
            }
            if (progress.percent() > progressLimitPercent) {
                throw new BusinessException(MessageCodes.REFUND_NOT_ELIGIBLE, "Learning progress exceeds refund limit");
            }
        } else {
            eligibilityResult = EligibilityResult.MANUAL_REVIEW_REQUIRED;
        }

        RefundEligibilitySnapshot snapshot = RefundEligibilitySnapshot.builder()
                .snapshotVersion("v2")
                .policyVersion(policy.policyVersion())
                .refundType(request.refundType())
                .paymentSucceededAt(paymentTime)
                .requestedAt(requestTime)
                .timezone(BUSINESS_ZONE.getId())
                .elapsedCalendarDays(elapsedDays)
                .refundWindowDays(refundWindowDays)
                .progressCompleted(progress.completed())
                .progressTotal(progress.total())
                .measuredProgressPercent(progress.percent())
                .progressThresholdPercent(progressLimitPercent)
                .actuallyPaidAmount(orderItemSnapshot.getGrossAmount())
                .currency(orderItemSnapshot.getCurrency())
                .orderId(order.getId())
                .orderItemId(orderItem.getId())
                .courseId(orderItem.getCourse().getId())
                .eligibilityResult(eligibilityResult)
                .build();

        RefundRequest refundRequest = new RefundRequest();
        refundRequest.setOrder(order);
        refundRequest.setOrderItem(orderItem);
        refundRequest.setStudent(student);
        refundRequest.setReason(request.reason());
        refundRequest.setStatus(RefundStatus.PENDING);
        refundRequest.setEligibilitySnapshot(snapshot);

        try {
            refundRequest = refundRequestRepository.saveAndFlush(refundRequest);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(MessageCodes.COMMON_CONFLICT, "A refund request already exists for this order item", HttpStatus.CONFLICT);
        }

        return refundMapper.toDetailResponse(refundRequest);
    }

    private StudentProfile getStudentProfile(UUID userId) {
        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Student profile not found", HttpStatus.NOT_FOUND));
    }

    @Override
    public PageResponse<RefundQueueResponse> getMyRefundRequests(UUID userId, Pageable pageable) {
        StudentProfile student = getStudentProfile(userId);
        Page<RefundRequest> page = refundRequestRepository.findByStudent_Id(student.getId(), pageable);
        return PageResponse.from(page.map(refundMapper::toQueueResponse));
    }

    @Override
    public RefundDetailResponse getMyRefundDetail(UUID userId, UUID refundId) {
        StudentProfile student = getStudentProfile(userId);
        RefundRequest refund = refundRequestRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Refund request not found"));
        if (!refund.getStudent().getId().equals(student.getId())) {
            throw new BusinessException(MessageCodes.AUTH_FORBIDDEN, "Not authorized", HttpStatus.FORBIDDEN);
        }
        return refundMapper.toDetailResponse(refund);
    }

    @Override
    @Transactional
    public void cancelRefundRequest(UUID userId, UUID refundId) {
        StudentProfile student = getStudentProfile(userId);
        RefundRequest refund = refundRequestRepository.findByIdForUpdate(refundId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Refund request not found"));
        if (!refund.getStudent().getId().equals(student.getId())) {
            throw new BusinessException(MessageCodes.AUTH_FORBIDDEN, "Not authorized", HttpStatus.FORBIDDEN);
        }
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "Only pending requests can be cancelled");
        }
        refund.setStatus(RefundStatus.CANCELLED);
        refundRequestRepository.save(refund);
    }
}
