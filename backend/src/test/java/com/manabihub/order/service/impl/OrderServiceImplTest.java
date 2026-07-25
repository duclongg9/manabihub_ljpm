package com.manabihub.order.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.mapper.OrderMapper;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private OrderMapper orderMapper;

    @InjectMocks
    private OrderServiceImpl service;

    private UUID userId;
    private StudentProfile student;
    private Course course;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        student = StudentProfile.builder().id(UUID.randomUUID()).build();
        course = Course.builder()
                .id(UUID.randomUUID())
                .title("N3 Grammar")
                .price(new BigDecimal("150000.00"))
                .currency("VND")
                .status(CourseStatus.PUBLISHED)
                .build();

        lenient().when(currentUserService.getCurrentUserId()).thenReturn(userId);
        lenient().when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
    }

    @Test
    void createOrder_publishedCourse_createsPendingOrderWithItem() {
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId()))
                .thenReturn(Optional.empty());
        when(orderRepository.existsByOrderCode(anyString())).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order created = service.createOrder(course.getId());

        assertEquals(OrderStatus.PENDING, created.getStatus());
        assertEquals(new BigDecimal("150000.00"), created.getTotalAmount());
        assertEquals("VND", created.getCurrency());

        ArgumentCaptor<OrderItem> itemCaptor = ArgumentCaptor.forClass(OrderItem.class);
        verify(orderItemRepository).save(itemCaptor.capture());
        assertEquals(course.getId(), itemCaptor.getValue().getCourse().getId());
        assertEquals(new BigDecimal("150000.00"), itemCaptor.getValue().getPrice());
    }

    @Test
    void createOrder_courseNotPublished_throws() {
        course.setStatus(CourseStatus.DRAFT);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));

        assertThrows(BusinessException.class, () -> service.createOrder(course.getId()));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_alreadyEnrolled_throws() {
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        Enrollment active = Enrollment.builder().status(EnrollmentStatus.ACTIVE).build();
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId()))
                .thenReturn(Optional.of(active));

        assertThrows(BusinessException.class, () -> service.createOrder(course.getId()));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_courseNotFound_throws() {
        when(courseRepository.findById(course.getId())).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> service.createOrder(course.getId()));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void enrollFreeOrder_createsEnrollmentAndMarksOrderPaid() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD-FREE")
                .totalAmount(BigDecimal.ZERO)
                .currency("VND")
                .status(OrderStatus.PENDING)
                .student(student)
                .build();
        when(orderItemRepository.findByOrder_Id(order.getId())).thenReturn(java.util.List.of(
                OrderItem.builder().order(order).course(course).price(BigDecimal.ZERO).build()));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId()))
                .thenReturn(Optional.empty());

        service.enrollFreeOrder(order);

        assertEquals(OrderStatus.PAID, order.getStatus());
        verify(enrollmentRepository).save(any(Enrollment.class));
        verify(orderRepository).save(order);
    }
}
