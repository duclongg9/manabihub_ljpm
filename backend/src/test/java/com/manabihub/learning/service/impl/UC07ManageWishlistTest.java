package com.manabihub.learning.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.response.WishlistItemResponse;
import com.manabihub.learning.entity.WishlistItem;
import com.manabihub.learning.repository.WishlistItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UC07ManageWishlistTest {

    @Mock private WishlistItemRepository wishlistRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private CurrentUserService currentUserService;

    private StudentWishlistServiceImpl service;
    private UUID userId;
    private StudentProfile student;
    private Course course;

    @BeforeEach
    void setUp() {
        service = new StudentWishlistServiceImpl(
                wishlistRepository,
                courseRepository,
                studentProfileRepository,
                currentUserService
        );
        userId = UUID.randomUUID();
        student = StudentProfile.builder().id(UUID.randomUUID()).build();
        course = Course.builder()
                .id(UUID.randomUUID())
                .title("N5 Starter")
                .slug("n5-starter")
                .price(BigDecimal.ZERO)
                .currency("VND")
                .status(CourseStatus.PUBLISHED)
                .build();
    }

    @Test
    @Order(701)
    @DisplayName("UTC01: Add a published course to the wishlist")
    void testAddCourse_UTC01_PublishedCourseAdded() {
        mockStudent();
        course.getModules().add(CourseModule.builder()
                .blocks(new ArrayList<>(List.of(LessonBlock.builder().build())))
                .build());
        WishlistItem savedItem = item();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(wishlistRepository.existsByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(false);
        when(wishlistRepository.saveAndFlush(any(WishlistItem.class))).thenReturn(savedItem);

        WishlistItemResponse result = service.addCourse(course.getId());

        assertEquals(course.getId(), result.courseId());
        assertEquals(1, result.totalLessons());
        verify(wishlistRepository).saveAndFlush(any(WishlistItem.class));
    }

    @Test
    @Order(702)
    @DisplayName("UTC02: Reject an existing duplicate course")
    void testAddCourse_UTC02_DuplicateCourseRejected() {
        mockStudent();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(wishlistRepository.existsByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.addCourse(course.getId())
        );

        assertEquals(MessageCodes.LEARNING_WISHLIST_DUPLICATE, exception.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        verify(wishlistRepository, never()).saveAndFlush(any());
    }

    @Test
    @Order(703)
    @DisplayName("UTC03: Reject an unpublished course")
    void testAddCourse_UTC03_UnpublishedCourseRejected() {
        mockStudent();
        course.setStatus(CourseStatus.DRAFT);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.addCourse(course.getId())
        );

        assertEquals(MessageCodes.COURSE_NOT_FOUND, exception.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        verify(wishlistRepository, never()).saveAndFlush(any());
    }

    @Test
    @Order(704)
    @DisplayName("UTC04: Return the current student's wishlist items")
    void testGetWishlist_UTC04_CurrentStudentItemsReturned() {
        mockStudent();
        WishlistItemRepository.CourseLessonCount lessonCount =
                mock(WishlistItemRepository.CourseLessonCount.class);
        when(lessonCount.getCourseId()).thenReturn(course.getId());
        when(lessonCount.getTotalLessons()).thenReturn(3L);
        when(wishlistRepository.countLessonsByStudentWishlist(student.getId()))
                .thenReturn(List.of(lessonCount));
        when(wishlistRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()))
                .thenReturn(List.of(item()));

        List<WishlistItemResponse> result = service.getWishlist();

        assertEquals(1, result.size());
        assertEquals(course.getId(), result.getFirst().courseId());
        assertEquals(3, result.getFirst().totalLessons());
        verify(wishlistRepository).findByStudentIdOrderByCreatedAtDesc(student.getId());
    }

    @Test
    @Order(705)
    @DisplayName("UTC05: Remove an owned wishlist item")
    void testRemoveCourse_UTC05_OwnedWishlistItemRemoved() {
        mockStudent();
        WishlistItem item = item();
        when(wishlistRepository.findByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(Optional.of(item));

        service.removeCourse(course.getId());

        verify(wishlistRepository).delete(item);
    }

    @Test
    @Order(706)
    @DisplayName("UTC06: Empty wishlist returns an empty list")
    void testGetWishlist_UTC06_EmptyWishlistReturnsEmptyListBoundary() {
        mockStudent();
        when(wishlistRepository.countLessonsByStudentWishlist(student.getId())).thenReturn(List.of());
        when(wishlistRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()))
                .thenReturn(List.of());

        List<WishlistItemResponse> result = service.getWishlist();

        assertTrue(result.isEmpty());
    }

    @Test
    @Order(707)
    @DisplayName("UTC07: Reject a missing course")
    void testAddCourse_UTC07_MissingCourseRejected() {
        mockStudent();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.addCourse(course.getId())
        );

        assertEquals(MessageCodes.COURSE_NOT_FOUND, exception.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        verify(wishlistRepository, never()).saveAndFlush(any());
    }

    @Test
    @Order(708)
    @DisplayName("UTC08: Map a database unique race to duplicate conflict")
    void testAddCourse_UTC08_DatabaseUniqueRaceMappedToDuplicate() {
        mockStudent();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(wishlistRepository.existsByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(false);
        when(wishlistRepository.saveAndFlush(any()))
                .thenThrow(new DataIntegrityViolationException(
                        "unique",
                        new SQLException(
                                "violates uq_student_wishlist_student_course",
                                "23505"
                        )
                ));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.addCourse(course.getId())
        );

        assertEquals(MessageCodes.LEARNING_WISHLIST_DUPLICATE, exception.getMessageCode());
        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
    }

    @Test
    @Order(709)
    @DisplayName("UTC09: Do not mask an unrelated database failure")
    void testAddCourse_UTC09_UnrelatedDatabaseFailureIsNotMasked() {
        mockStudent();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(wishlistRepository.existsByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(false);
        DataIntegrityViolationException databaseFailure =
                new DataIntegrityViolationException("foreign key failure");
        when(wishlistRepository.saveAndFlush(any())).thenThrow(databaseFailure);

        DataIntegrityViolationException exception = assertThrows(
                DataIntegrityViolationException.class,
                () -> service.addCourse(course.getId())
        );

        assertSame(databaseFailure, exception);
    }

    @Test
    @Order(710)
    @DisplayName("UTC10: Reject a missing owned wishlist item")
    void testRemoveCourse_UTC10_MissingOwnedItemRejected() {
        mockStudent();
        when(wishlistRepository.findByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.removeCourse(course.getId())
        );

        assertEquals(MessageCodes.LEARNING_WISHLIST_ITEM_NOT_FOUND, exception.getMessageCode());
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        verify(wishlistRepository, never()).delete(any());
    }

    @Test
    @Order(711)
    @DisplayName("UTC11: Reject a missing student profile")
    void testGetWishlist_UTC11_MissingStudentProfileRejected() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, service::getWishlist);

        assertEquals(MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND, exception.getMessageCode());
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
    }

    @Test
    @Order(712)
    @DisplayName("UTC12: Zero-module course returns zero lessons")
    void testAddCourse_UTC12_ZeroModuleCourseReturnsZeroLessonsBoundary() {
        mockStudent();
        WishlistItem savedItem = item();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(wishlistRepository.existsByStudentIdAndCourseId(student.getId(), course.getId()))
                .thenReturn(false);
        when(wishlistRepository.saveAndFlush(any(WishlistItem.class))).thenReturn(savedItem);

        WishlistItemResponse result = service.addCourse(course.getId());

        assertEquals(0, result.totalLessons());
    }

    private void mockStudent() {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
    }

    private WishlistItem item() {
        return WishlistItem.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .createdAt(Instant.parse("2026-07-28T00:00:00Z"))
                .build();
    }
}
