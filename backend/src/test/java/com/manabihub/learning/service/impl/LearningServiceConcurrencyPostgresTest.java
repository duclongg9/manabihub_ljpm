package com.manabihub.learning.service.impl;

import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.request.ReviewFlashcardRequest;
import com.manabihub.learning.dto.response.LessonProgressResponse;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.entity.LessonBlockProgress;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.enums.FlashcardStatus;
import com.manabihub.learning.enums.LessonProgressStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.repository.FlashcardProgressRepository;
import com.manabihub.learning.repository.LessonBlockProgressRepository;
import com.manabihub.learning.service.LearningService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
public class LearningServiceConcurrencyPostgresTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("manabihub_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired private LearningService learningService;
    @Autowired private AppUserRepository userRepository;
    @Autowired private StudentProfileRepository studentProfileRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private LessonBlockRepository lessonBlockRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private LessonBlockProgressRepository lessonBlockProgressRepository;
    @Autowired private FlashcardProgressRepository flashcardProgressRepository;

    @MockBean private CurrentUserService currentUserService;

    private AppUser user;
    private StudentProfile studentProfile;
    private Course course;
    private CourseModule module;
    private LessonBlock flashcardBlock;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        user = AppUser.builder().id(UUID.randomUUID()).email("test@example.com").fullName("Test").build();
        userRepository.save(user);

        studentProfile = StudentProfile.builder().id(UUID.randomUUID()).user(user).displayName("Test Student").build();
        studentProfileRepository.save(studentProfile);

        course = Course.builder().id(UUID.randomUUID()).title("Test Course").modules(new ArrayList<>()).build();
        module = CourseModule.builder().id(UUID.randomUUID()).title("Mod 1").course(course).blocks(new ArrayList<>()).orderIndex(1).build();
        course.addModule(module);
        courseRepository.save(course);

        flashcardBlock = LessonBlock.builder().id(UUID.randomUUID()).type(LessonBlockType.FLASHCARD)
                .title("Flashcards").module(module).orderIndex(1)
                .flashcardsJson("[{\"front\":\"A\",\"back\":\"B\"}, {\"front\":\"C\",\"back\":\"D\"}]").build();
        lessonBlockRepository.save(flashcardBlock);

        enrollment = Enrollment.builder().id(UUID.randomUUID()).student(studentProfile).course(course).status(EnrollmentStatus.ACTIVE).build();
        enrollmentRepository.save(enrollment);

        when(currentUserService.getCurrentUserId()).thenReturn(user.getId());
    }

    @AfterEach
    void tearDown() {
        flashcardProgressRepository.deleteAll();
        lessonBlockProgressRepository.deleteAll();
        enrollmentRepository.deleteAll();
        lessonBlockRepository.deleteAll();
        courseRepository.deleteAll();
        studentProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Concurrent same-card reviews produce exactly 1 row and zero exceptions")
    void testConcurrentSameCard() throws Exception {
        int threads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        List<Future<LessonProgressResponse>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() ->
                    learningService.reviewFlashcard(flashcardBlock.getId(),
                            new ReviewFlashcardRequest(0, FlashcardStatus.REMEMBERED))));
        }

        executor.shutdown();
        assertTrue(executor.awaitTermination(30, TimeUnit.SECONDS), "Executor must complete within timeout");

        List<Throwable> errors = new ArrayList<>();
        for (Future<LessonProgressResponse> f : futures) {
            try {
                f.get();
            } catch (Exception e) {
                errors.add(e.getCause() != null ? e.getCause() : e);
            }
        }
        assertEquals(0, errors.size(), "All requests must succeed, but got: " + errors);

        int count = flashcardProgressRepository.countByEnrollmentIdAndLessonBlockId(enrollment.getId(), flashcardBlock.getId());
        assertEquals(1, count, "Exactly 1 flashcard_progress row for card_index=0");

        var persisted = flashcardProgressRepository.findByEnrollmentIdAndLessonBlockIdAndCardIndex(
                enrollment.getId(), flashcardBlock.getId(), 0).orElseThrow();
        assertEquals(FlashcardStatus.REMEMBERED, persisted.getStatus());
    }

    @Test
    @DisplayName("Concurrent card-0 and card-1 reviews produce 2 rows and COMPLETED")
    void testConcurrentDifferentCards() throws Exception {
        int threads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        List<Future<LessonProgressResponse>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            int cardIndex = i % 2;
            FlashcardStatus status = cardIndex == 0 ? FlashcardStatus.REMEMBERED : FlashcardStatus.NEEDS_REVIEW;
            futures.add(executor.submit(() ->
                    learningService.reviewFlashcard(flashcardBlock.getId(),
                            new ReviewFlashcardRequest(cardIndex, status))));
        }

        executor.shutdown();
        assertTrue(executor.awaitTermination(30, TimeUnit.SECONDS), "Executor must complete within timeout");

        List<Throwable> errors = new ArrayList<>();
        for (Future<LessonProgressResponse> f : futures) {
            try {
                f.get();
            } catch (Exception e) {
                errors.add(e.getCause() != null ? e.getCause() : e);
            }
        }
        assertEquals(0, errors.size(), "All requests must succeed, but got: " + errors);

        int count = flashcardProgressRepository.countByEnrollmentIdAndLessonBlockId(enrollment.getId(), flashcardBlock.getId());
        assertEquals(2, count, "Exactly 2 flashcard_progress rows (one per card)");

        LessonBlockProgress finalProgress = lessonBlockProgressRepository
                .findByEnrollmentIdAndLessonBlockId(enrollment.getId(), flashcardBlock.getId())
                .orElseThrow(() -> new AssertionError("LessonBlockProgress must exist"));
        assertEquals(LessonProgressStatus.COMPLETED, finalProgress.getStatus(),
                "All cards reviewed => block COMPLETED");
    }

    @Test
    @DisplayName("Sequential persisted reload: upsert updates, count drives completion")
    void testSequentialPersistedReload() {
        LessonProgressResponse r1 = learningService.reviewFlashcard(flashcardBlock.getId(),
                new ReviewFlashcardRequest(0, FlashcardStatus.NEEDS_REVIEW));
        assertEquals(LessonProgressStatus.IN_PROGRESS, r1.status());

        LessonProgressResponse r2 = learningService.reviewFlashcard(flashcardBlock.getId(),
                new ReviewFlashcardRequest(0, FlashcardStatus.REMEMBERED));
        assertEquals(LessonProgressStatus.IN_PROGRESS, r2.status());

        int count = flashcardProgressRepository.countByEnrollmentIdAndLessonBlockId(enrollment.getId(), flashcardBlock.getId());
        assertEquals(1, count, "Still 1 row after upsert update");

        var persisted = flashcardProgressRepository.findByEnrollmentIdAndLessonBlockIdAndCardIndex(
                enrollment.getId(), flashcardBlock.getId(), 0).orElseThrow();
        assertEquals(FlashcardStatus.REMEMBERED, persisted.getStatus(), "Status must be updated to REMEMBERED");

        LessonProgressResponse r3 = learningService.reviewFlashcard(flashcardBlock.getId(),
                new ReviewFlashcardRequest(1, FlashcardStatus.REMEMBERED));
        assertEquals(LessonProgressStatus.COMPLETED, r3.status());
        assertNotNull(r3.completedAt());
    }

    @Test
    @DisplayName("Another student's reviews are isolated")
    void testAnotherStudentIsolation() {
        AppUser user2 = AppUser.builder().id(UUID.randomUUID()).email("user2@example.com").fullName("Test 2").build();
        userRepository.save(user2);
        StudentProfile student2 = StudentProfile.builder().id(UUID.randomUUID()).user(user2).displayName("Student 2").build();
        studentProfileRepository.save(student2);
        Enrollment enrollment2 = Enrollment.builder().id(UUID.randomUUID()).student(student2).course(course).status(EnrollmentStatus.ACTIVE).build();
        enrollmentRepository.save(enrollment2);

        when(currentUserService.getCurrentUserId()).thenReturn(user2.getId());
        learningService.reviewFlashcard(flashcardBlock.getId(), new ReviewFlashcardRequest(0, FlashcardStatus.REMEMBERED));

        int count2 = flashcardProgressRepository.countByEnrollmentIdAndLessonBlockId(enrollment2.getId(), flashcardBlock.getId());
        assertEquals(1, count2, "Student 2 must have 1 row");

        int count1 = flashcardProgressRepository.countByEnrollmentIdAndLessonBlockId(enrollment.getId(), flashcardBlock.getId());
        assertEquals(0, count1, "Student 1 must have 0 rows");
    }
}
