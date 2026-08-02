package com.manabihub.refund.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.service.LearningProgressDomainService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderItemSnapshotRepository;
import com.manabihub.payment.entity.PaymentTransaction;
import com.manabihub.payment.enums.PaymentStatus;
import com.manabihub.payment.repository.PaymentTransactionRepository;
import com.manabihub.refund.dto.request.CreateStudentRefundRequest;
import com.manabihub.refund.dto.response.RefundDetailResponse;
import com.manabihub.refund.entity.RefundRequest;
import com.manabihub.refund.enums.StudentRefundType;
import com.manabihub.refund.enums.RefundStatus;
import com.manabihub.refund.mapper.RefundMapper;
import com.manabihub.refund.repository.RefundRequestRepository;
import com.manabihub.systemconfig.model.CommercialPolicy;
import com.manabihub.systemconfig.service.CommercialPolicyService;
import com.manabihub.identity.repository.StudentProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentRefundServiceImplTest {

    @Mock
    private StudentProfileRepository studentProfileRepository;
    @Mock
    private RefundRequestRepository refundRequestRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private OrderItemSnapshotRepository orderItemSnapshotRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private CommercialPolicyService commercialPolicyService;
    @Mock
    private LearningProgressDomainService learningProgressDomainService;
    @Mock
    private RefundMapper refundMapper;

    @InjectMocks
    private StudentRefundServiceImpl service;

    private StudentProfile student;
    private StudentProfile otherStudent;
    private OrderItem orderItem;
    private Order order;
    private Enrollment enrollment;
    private PaymentTransaction paymentTransaction;

    private AppUser appUser;

    @BeforeEach
    void setUp() {
        appUser = new AppUser();
        appUser.setId(UUID.randomUUID());

        student = new StudentProfile();
        student.setId(UUID.randomUUID());
        student.setUser(appUser);

        otherStudent = new StudentProfile();
        otherStudent.setId(UUID.randomUUID());
        otherStudent.setUser(new AppUser());

        order = new Order();
        order.setId(UUID.randomUUID());
        order.setStudent(student);

        orderItem = new OrderItem();
        orderItem.setId(UUID.randomUUID());
        orderItem.setOrder(order);
        com.manabihub.course.entity.Course course = new com.manabihub.course.entity.Course();
        course.setId(UUID.randomUUID());
        orderItem.setCourse(course);

        enrollment = new Enrollment();
        enrollment.setId(UUID.randomUUID());

        paymentTransaction = new PaymentTransaction();
        paymentTransaction.setUpdatedAt(Instant.now().minus(2, ChronoUnit.DAYS)); // Paid 2 days ago
    }

    @Test
    void requestRefund_whenProgressExceedsLimit_throwsException() {
        CreateStudentRefundRequest request = new CreateStudentRefundRequest(orderItem.getId(), StudentRefundType.STANDARD, "Not what I expected");

        when(studentProfileRepository.findByUser_Id(appUser.getId())).thenReturn(Optional.of(student));
        when(orderItemRepository.findById(orderItem.getId())).thenReturn(Optional.of(orderItem));
        com.manabihub.order.entity.OrderItemSnapshot snapshot = com.manabihub.order.entity.OrderItemSnapshot.builder()
                .grossAmount(new java.math.BigDecimal("1000000"))
                .currency("VND")
                .build();
        when(orderItemSnapshotRepository.findByOrderItem_Id(orderItem.getId())).thenReturn(Optional.of(snapshot));
        CommercialPolicy policy = mock(CommercialPolicy.class);
        when(policy.refundWindowDays()).thenReturn(7);
        when(policy.refundProgressLimitPercent()).thenReturn(20);
        when(commercialPolicyService.getCurrentPolicy()).thenReturn(policy);
        
        when(paymentTransactionRepository.findFirstByOrder_IdAndStatusInOrderByUpdatedAtDesc(
                eq(order.getId()), anyList()
        )).thenReturn(Optional.of(paymentTransaction));

        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId()))
                .thenReturn(Optional.of(enrollment));
        
        // Progress is 30% (> 20% limit)
        when(learningProgressDomainService.calculateProgress(orderItem.getCourse().getId(), enrollment.getId()))
                .thenReturn(new LearningProgressDomainService.ProgressResult(3, 10, 30.0));

        BusinessException exception = assertThrows(BusinessException.class, () -> 
            service.createRefundRequest(appUser.getId(), request)
        );

        assertEquals(MessageCodes.REFUND_NOT_ELIGIBLE, exception.getMessageCode());
        assertTrue(exception.getMessage().contains("exceeds refund limit"));
    }

    @Test
    void requestRefund_whenWindowExpired_throwsException() {
        CreateStudentRefundRequest request = new CreateStudentRefundRequest(orderItem.getId(), StudentRefundType.STANDARD, "Too late");

        when(studentProfileRepository.findByUser_Id(appUser.getId())).thenReturn(Optional.of(student));
        when(orderItemRepository.findById(orderItem.getId())).thenReturn(Optional.of(orderItem));
        com.manabihub.order.entity.OrderItemSnapshot snapshot = com.manabihub.order.entity.OrderItemSnapshot.builder()
                .grossAmount(new java.math.BigDecimal("1000000"))
                .currency("VND")
                .build();
        when(orderItemSnapshotRepository.findByOrderItem_Id(orderItem.getId())).thenReturn(Optional.of(snapshot));
        CommercialPolicy policy = mock(CommercialPolicy.class);
        when(policy.refundWindowDays()).thenReturn(7);
        when(policy.refundProgressLimitPercent()).thenReturn(20);
        when(commercialPolicyService.getCurrentPolicy()).thenReturn(policy);
        
        // Paid 10 days ago (window is 7 days)
        paymentTransaction.setUpdatedAt(Instant.now().minus(10, ChronoUnit.DAYS));
        when(paymentTransactionRepository.findFirstByOrder_IdAndStatusInOrderByUpdatedAtDesc(
                eq(order.getId()), anyList()
        )).thenReturn(Optional.of(paymentTransaction));

        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId()))
                .thenReturn(Optional.of(enrollment));
        
        // Progress is 10% (under 20% limit)
        when(learningProgressDomainService.calculateProgress(orderItem.getCourse().getId(), enrollment.getId()))
                .thenReturn(new LearningProgressDomainService.ProgressResult(1, 10, 10.0));

        BusinessException exception = assertThrows(BusinessException.class, () -> 
            service.createRefundRequest(appUser.getId(), request)
        );

        assertEquals(MessageCodes.REFUND_NOT_ELIGIBLE, exception.getMessageCode());
        assertTrue(exception.getMessage().contains("Refund window has expired"));
    }

    @Test
    void requestRefund_handlesIdempotency_whenAlreadyExists() {
        CreateStudentRefundRequest request = new CreateStudentRefundRequest(orderItem.getId(), StudentRefundType.STANDARD, "Dup request");

        when(studentProfileRepository.findByUser_Id(appUser.getId())).thenReturn(Optional.of(student));
        when(orderItemRepository.findById(orderItem.getId())).thenReturn(Optional.of(orderItem));
        com.manabihub.order.entity.OrderItemSnapshot snapshot = com.manabihub.order.entity.OrderItemSnapshot.builder()
                .grossAmount(new java.math.BigDecimal("1000000"))
                .currency("VND")
                .build();
        when(orderItemSnapshotRepository.findByOrderItem_Id(orderItem.getId())).thenReturn(Optional.of(snapshot));
        CommercialPolicy policy = mock(CommercialPolicy.class);
        when(policy.refundWindowDays()).thenReturn(7);
        when(policy.refundProgressLimitPercent()).thenReturn(20);
        when(commercialPolicyService.getCurrentPolicy()).thenReturn(policy);
        
        when(paymentTransactionRepository.findFirstByOrder_IdAndStatusInOrderByUpdatedAtDesc(
                eq(order.getId()), anyList()
        )).thenReturn(Optional.of(paymentTransaction));

        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), orderItem.getCourse().getId()))
                .thenReturn(Optional.of(enrollment));
        
        when(learningProgressDomainService.calculateProgress(orderItem.getCourse().getId(), enrollment.getId()))
                .thenReturn(new LearningProgressDomainService.ProgressResult(1, 10, 10.0));

        when(refundRequestRepository.saveAndFlush(any(RefundRequest.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint \"uq_refund_request_active_order_item\""));

        BusinessException exception = assertThrows(BusinessException.class, () -> 
            service.createRefundRequest(appUser.getId(), request)
        );

        assertEquals(MessageCodes.COMMON_CONFLICT, exception.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("already exists for this order item"));
    }

    @Test
    void getMyRefundDetail_whenNotOwner_throwsAuthForbidden() {
        RefundRequest refund = new RefundRequest();
        refund.setId(UUID.randomUUID());
        refund.setStudent(otherStudent);

        when(studentProfileRepository.findByUser_Id(appUser.getId())).thenReturn(Optional.of(student));
        when(refundRequestRepository.findById(refund.getId())).thenReturn(Optional.of(refund));

        BusinessException exception = assertThrows(BusinessException.class, () -> 
            service.getMyRefundDetail(appUser.getId(), refund.getId())
        );

        assertEquals(MessageCodes.AUTH_FORBIDDEN, exception.getMessageCode());
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
    }

    @Test
    void cancelRefund_whenNotPending_throwsBadRequest() {
        RefundRequest refund = new RefundRequest();
        refund.setId(UUID.randomUUID());
        refund.setStudent(student);
        refund.setStatus(RefundStatus.PROCESSING);

        when(studentProfileRepository.findByUser_Id(appUser.getId())).thenReturn(Optional.of(student));
        when(refundRequestRepository.findByIdForUpdate(refund.getId())).thenReturn(Optional.of(refund));

        BusinessException exception = assertThrows(BusinessException.class, () -> 
            service.cancelRefundRequest(appUser.getId(), refund.getId())
        );

        assertEquals(MessageCodes.COMMON_BAD_REQUEST, exception.getMessageCode());
        assertTrue(exception.getMessage().contains("Only pending requests can be cancelled"));
    }
}
