package com.manabihub.order.service.impl;

import com.manabihub.common.constants.MessageCodes;
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
import com.manabihub.order.dto.response.OrderResponse;
import com.manabihub.order.entity.Order;
import com.manabihub.order.entity.OrderItem;
import com.manabihub.order.mapper.OrderMapper;
import com.manabihub.order.repository.OrderItemRepository;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final DateTimeFormatter ORDER_CODE_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<EnrollmentStatus> OWNED_STATUSES =
            EnumSet.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CurrentUserService currentUserService;
    private final OrderMapper orderMapper;

    @Override
    @Transactional
    public Order createOrder(UUID courseId) {
        StudentProfile student = resolveCurrentStudent();

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Course was not found",
                        HttpStatus.NOT_FOUND));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new BusinessException(
                    MessageCodes.ORDER_COURSE_NOT_PUBLISHED,
                    "This course is not available for purchase",
                    HttpStatus.BAD_REQUEST);
        }

        boolean alreadyOwned = enrollmentRepository
                .findByStudent_IdAndCourse_Id(student.getId(), courseId)
                .map(Enrollment::getStatus)
                .filter(OWNED_STATUSES::contains)
                .isPresent();
        if (alreadyOwned) {
            throw new BusinessException(
                    MessageCodes.ORDER_ALREADY_ENROLLED,
                    "You already own this course",
                    HttpStatus.CONFLICT);
        }

        Order order = orderRepository.save(Order.builder()
                .student(student)
                .orderCode(generateOrderCode())
                .totalAmount(course.getPrice())
                .currency(course.getCurrency())
                .status(com.manabihub.order.enums.OrderStatus.PENDING)
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .course(course)
                .price(course.getPrice())
                .build());

        return order;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderForCurrentStudent(UUID orderId) {
        StudentProfile student = resolveCurrentStudent();

        Order order = orderRepository.findById(orderId)
                .filter(o -> o.getStudent().getId().equals(student.getId()))
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.ORDER_NOT_FOUND,
                        "Order was not found",
                        HttpStatus.NOT_FOUND));

        return orderMapper.toResponse(order, orderItemRepository.findByOrder_Id(order.getId()));
    }

    private StudentProfile resolveCurrentStudent() {
        UUID userId = currentUserService.getCurrentUserId();
        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found",
                        HttpStatus.NOT_FOUND));
    }

    private String generateOrderCode() {
        String code;
        do {
            code = "OD" + ORDER_CODE_TIME.format(java.time.Instant.now())
                    + String.format("%04d", RANDOM.nextInt(10_000));
        } while (orderRepository.existsByOrderCode(code));
        return code;
    }
}
