package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.request.SaveVideoProgressRequest;
import com.manabihub.learning.dto.response.CourseLearningResponse;
import com.manabihub.learning.dto.response.CourseProgressSummaryResponse;
import com.manabihub.learning.dto.response.LearningLessonBlockResponse;
import com.manabihub.learning.dto.response.LessonProgressResponse;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.entity.LessonProgress;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.enums.LessonProgressStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.repository.LessonProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LearningServiceImplTest {

    @Mock private CourseRepository courseRepository;
    @Mock private LessonBlockRepository lessonBlockRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private LessonProgressRepository lessonProgressRepository;
    @Mock private CurrentUserService currentUserService;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private LearningServiceImpl learningService;

    private UUID currentUserId;
    private UUID studentId;
    private UUID courseId;
    private UUID moduleId;
    private UUID enrollmentId;
    private UUID blockVideoId;
    private UUID blockTextId;
    private UUID blockQuizId;

    private StudentProfile studentProfile;
    private Course course;
    private CourseModule courseModule;
    private Enrollment enrollment;
    private LessonBlock videoBlock;
    private LessonBlock textBlock;
    private LessonBlock quizBlock;

    @BeforeEach
    void setUp() {
        currentUserId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        courseId = UUID.randomUUID();
        moduleId = UUID.randomUUID();
        enrollmentId = UUID.randomUUID();
        blockVideoId = UUID.randomUUID();
        blockTextId = UUID.randomUUID();
        blockQuizId = UUID.randomUUID();

        studentProfile = StudentProfile.builder().id(studentId).build();

        courseModule = CourseModule.builder().id(moduleId).title("Module 1").orderIndex(1).blocks(new ArrayList<>()).build();
        course = Course.builder().id(courseId).title("Course").modules(new ArrayList<>()).build();
        course.addModule(courseModule);

        enrollment = Enrollment.builder().id(enrollmentId).student(studentProfile).course(course).status(EnrollmentStatus.ACTIVE).build();

        videoBlock = LessonBlock.builder().id(blockVideoId).type(LessonBlockType.VIDEO).title("Video 1")
                .videoUrl("https://cdn.example.com/video.mp4").durationMinutes(5).orderIndex(1).module(courseModule).build();
        textBlock = LessonBlock.builder().id(blockTextId).type(LessonBlockType.TEXT).title("Text 1")
                .content("Noi dung bai doc").orderIndex(2).module(courseModule).build();
        quizBlock = LessonBlock.builder().id(blockQuizId).type(LessonBlockType.QUIZ).title("Quiz 1")
                .quizQuestion("Cau hoi?").quizOptionsJson("[\"A\",\"B\"]").quizAnswer("A").orderIndex(3).module(courseModule).build();
    }

    private void mockActiveEnrollment() {
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(studentProfileRepository.findByUser_Id(currentUserId)).thenReturn(Optional.of(studentProfile));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)).thenReturn(Optional.of(enrollment));
    }

    private LessonProgress completedProgress(LessonBlock block) {
        return LessonProgress.builder().id(UUID.randomUUID()).enrollment(enrollment).lessonBlock(block)
                .status(LessonProgressStatus.COMPLETED).build();
    }

    // ==========================================
    // 1. openOrResumeCourse Tests (Order: 1xx)
    // ==========================================

    @Test
    @Order(101)
    @DisplayName("UTC01: Course NOT FOUND")
    void testOpenOrResumeCourse_UTC01_CourseNotFound() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.openOrResumeCourse(courseId));
        assertEquals(MessageCodes.COURSE_NOT_FOUND, ex.getMessageCode());
    }

    @Test
    @Order(102)
    @DisplayName("UTC02: Student profile NOT FOUND")
    void testOpenOrResumeCourse_UTC02_StudentProfileNotFound() {
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(studentProfileRepository.findByUser_Id(currentUserId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.openOrResumeCourse(courseId));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    @Test
    @Order(103)
    @DisplayName("UTC03: Enrollment NOT FOUND (SRS 3a)")
    void testOpenOrResumeCourse_UTC03_EnrollmentNotFound() {
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(studentProfileRepository.findByUser_Id(currentUserId)).thenReturn(Optional.of(studentProfile));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.openOrResumeCourse(courseId));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    @Test
    @Order(104)
    @DisplayName("UTC04: Enrollment REVOKED - access denied (SRS 3a)")
    void testOpenOrResumeCourse_UTC04_EnrollmentRevoked() {
        enrollment.setStatus(EnrollmentStatus.REVOKED);
        mockActiveEnrollment();

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.openOrResumeCourse(courseId));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    @Test
    @Order(105)
    @DisplayName("UTC05: Course has no lesson content (SRS 4b, non-fatal)")
    void testOpenOrResumeCourse_UTC05_NoContent() {
        mockActiveEnrollment();

        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);
        assertTrue(response.modules().isEmpty());
        assertNull(response.currentLessonBlockId());
        assertEquals(0, response.totalLessons());
        assertFalse(response.warnings().isEmpty());
    }

    @Test
    @Order(106)
    @DisplayName("UTC06: First time studying - opens first lesson (SRS 4a)")
    void testOpenOrResumeCourse_UTC06_FirstLesson() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        courseModule.addBlock(quizBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of());

        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);
        assertEquals(blockVideoId, response.currentLessonBlockId());
        assertEquals(3, response.totalLessons());
        assertEquals(0, response.completedLessons());
        assertFalse(response.courseCompleted());
    }

    @Test
    @Order(107)
    @DisplayName("UTC07: Resume - continues from first incomplete lesson (SRS 5b)")
    void testOpenOrResumeCourse_UTC07_Resume() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        courseModule.addBlock(quizBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of(completedProgress(videoBlock)));

        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);
        assertEquals(blockTextId, response.currentLessonBlockId());
        assertEquals(1, response.completedLessons());
    }

    @Test
    @Order(108)
    @DisplayName("UTC08: All lessons completed")
    void testOpenOrResumeCourse_UTC08_AllCompleted() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        courseModule.addBlock(quizBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId))
                .thenReturn(List.of(completedProgress(videoBlock), completedProgress(textBlock), completedProgress(quizBlock)));

        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);
        assertEquals(blockVideoId, response.currentLessonBlockId());
        assertTrue(response.courseCompleted());
        assertEquals(3, response.completedLessons());
    }

    @Test
    @Order(109)
    @DisplayName("UTC09: Lesson content missing - non-fatal warning (SRS 4b)")
    void testOpenOrResumeCourse_UTC09_ContentMissing() {
        videoBlock.setVideoUrl(null);
        courseModule.addBlock(videoBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of());

        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);
        assertFalse(response.warnings().isEmpty());
        LearningLessonBlockResponse blockResponse = response.modules().get(0).blocks().get(0);
        assertFalse(blockResponse.contentAvailable());
    }

    @Test
    @Order(110)
    @DisplayName("UTC10: Enrollment COMPLETED can still review the course")
    void testOpenOrResumeCourse_UTC10_CompletedEnrollmentStillHasAccess() {
        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        courseModule.addBlock(videoBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of(completedProgress(videoBlock)));

        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);
        assertTrue(response.courseCompleted());
        assertEquals(1, response.completedLessons());
    }

    @Test
    @Order(111)
    @DisplayName("UTC11: Enrollment REFUNDED - access denied (SRS 3a)")
    void testOpenOrResumeCourse_UTC11_EnrollmentRefunded() {
        enrollment.setStatus(EnrollmentStatus.REFUNDED);
        mockActiveEnrollment();

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.openOrResumeCourse(courseId));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    // ==========================================
    // 2. saveVideoProgress Tests (Order: 2xx)
    // ==========================================

    @Test
    @Order(201)
    @DisplayName("UTC01: Lesson block NOT FOUND")
    void testSaveVideoProgress_UTC01_BlockNotFound() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(10)));
        assertEquals(MessageCodes.CONTENT_NOT_FOUND, ex.getMessageCode());
    }

    @Test
    @Order(202)
    @DisplayName("UTC02: Not enrolled")
    void testSaveVideoProgress_UTC02_NotEnrolled() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(studentProfileRepository.findByUser_Id(currentUserId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(10)));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    @Test
    @Order(203)
    @DisplayName("UTC03: Block type is not VIDEO")
    void testSaveVideoProgress_UTC03_InvalidBlockType() {
        when(lessonBlockRepository.findById(blockTextId)).thenReturn(Optional.of(textBlock));
        mockActiveEnrollment();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> learningService.saveVideoProgress(blockTextId, new SaveVideoProgressRequest(10)));
        assertEquals(MessageCodes.LEARNING_INVALID_BLOCK_TYPE, ex.getMessageCode());
    }

    @Test
    @Order(204)
    @DisplayName("UTC04: Video content missing (no videoUrl, SRS 4b)")
    void testSaveVideoProgress_UTC04_ContentMissing() {
        videoBlock.setVideoUrl(null);
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(10)));
        assertEquals(MessageCodes.LEARNING_LESSON_CONTENT_UNAVAILABLE, ex.getMessageCode());
    }

    @Test
    @Order(205)
    @DisplayName("UTC05: Video position exceeds duration")
    void testSaveVideoProgress_UTC05_InvalidPosition() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(400)));
        assertEquals(MessageCodes.LEARNING_INVALID_VIDEO_POSITION, ex.getMessageCode());
    }

    @Test
    @Order(206)
    @DisplayName("UTC06: Create new progress (first save)")
    void testSaveVideoProgress_UTC06_CreateNew() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(120));
        assertEquals(LessonProgressStatus.IN_PROGRESS, response.status());
        assertEquals(120, response.lastVideoPositionSeconds());
    }

    @Test
    @Order(207)
    @DisplayName("UTC07: Resume video - update existing IN_PROGRESS (SRS 5b)")
    void testSaveVideoProgress_UTC07_UpdateInProgress() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        LessonProgress existing = LessonProgress.builder().id(UUID.randomUUID()).enrollment(enrollment).lessonBlock(videoBlock)
                .status(LessonProgressStatus.IN_PROGRESS).lastVideoPositionSeconds(60).build();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.of(existing));
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(200));
        assertEquals(LessonProgressStatus.IN_PROGRESS, response.status());
        assertEquals(200, response.lastVideoPositionSeconds());
    }

    @Test
    @Order(208)
    @DisplayName("UTC08: Update position on already COMPLETED lesson - status unchanged")
    void testSaveVideoProgress_UTC08_CompletedStaysCompleted() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        Instant completedAt = Instant.now().minusSeconds(3600);
        LessonProgress existing = LessonProgress.builder().id(UUID.randomUUID()).enrollment(enrollment).lessonBlock(videoBlock)
                .status(LessonProgressStatus.COMPLETED).completedAt(completedAt).lastVideoPositionSeconds(300).build();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.of(existing));
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.saveVideoProgress(blockVideoId, new SaveVideoProgressRequest(100));
        assertEquals(LessonProgressStatus.COMPLETED, response.status());
        assertEquals(100, response.lastVideoPositionSeconds());
        assertEquals(completedAt, response.completedAt());
    }

    // ==========================================
    // 3. markLessonComplete Tests (Order: 3xx)
    // ==========================================

    @Test
    @Order(301)
    @DisplayName("UTC01: Lesson block NOT FOUND")
    void testMarkLessonComplete_UTC01_BlockNotFound() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.markLessonComplete(blockVideoId));
        assertEquals(MessageCodes.CONTENT_NOT_FOUND, ex.getMessageCode());
    }

    @Test
    @Order(302)
    @DisplayName("UTC02: Not enrolled")
    void testMarkLessonComplete_UTC02_NotEnrolled() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(studentProfileRepository.findByUser_Id(currentUserId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.markLessonComplete(blockVideoId));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    @Test
    @Order(303)
    @DisplayName("UTC03: Complete for the first time (no progress yet)")
    void testMarkLessonComplete_UTC03_CreateNew() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.markLessonComplete(blockVideoId);
        assertEquals(LessonProgressStatus.COMPLETED, response.status());
        assertNotNull(response.completedAt());
    }

    @Test
    @Order(304)
    @DisplayName("UTC04: Complete from IN_PROGRESS")
    void testMarkLessonComplete_UTC04_FromInProgress() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        LessonProgress existing = LessonProgress.builder().id(UUID.randomUUID()).enrollment(enrollment).lessonBlock(videoBlock)
                .status(LessonProgressStatus.IN_PROGRESS).build();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.of(existing));
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.markLessonComplete(blockVideoId);
        assertEquals(LessonProgressStatus.COMPLETED, response.status());
        assertNotNull(response.completedAt());
    }

    @Test
    @Order(305)
    @DisplayName("UTC05: Complete again - idempotent, completedAt unchanged")
    void testMarkLessonComplete_UTC05_Idempotent() {
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        Instant firstCompletedAt = Instant.now().minusSeconds(600);
        LessonProgress existing = LessonProgress.builder().id(UUID.randomUUID()).enrollment(enrollment).lessonBlock(videoBlock)
                .status(LessonProgressStatus.COMPLETED).completedAt(firstCompletedAt).build();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.of(existing));
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.markLessonComplete(blockVideoId);
        assertEquals(firstCompletedAt, response.completedAt());
    }

    @Test
    @Order(306)
    @DisplayName("UTC06: QUIZ block completes without grading (out of scope)")
    void testMarkLessonComplete_UTC06_QuizNoGrading() {
        when(lessonBlockRepository.findById(blockQuizId)).thenReturn(Optional.of(quizBlock));
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockQuizId)).thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonProgressResponse response = learningService.markLessonComplete(blockQuizId);
        assertEquals(LessonProgressStatus.COMPLETED, response.status());
    }

    @Test
    @Order(307)
    @DisplayName("UTC07: Completing the last remaining lesson marks enrollment COMPLETED (SRS 8-9)")
    void testMarkLessonComplete_UTC07_LastLessonCompletesEnrollment() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        when(lessonBlockRepository.findById(blockTextId)).thenReturn(Optional.of(textBlock));
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockTextId)).thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of(completedProgress(videoBlock)));

        LessonProgressResponse response = learningService.markLessonComplete(blockTextId);

        assertEquals(LessonProgressStatus.COMPLETED, response.status());
        assertEquals(EnrollmentStatus.COMPLETED, enrollment.getStatus());
        assertNotNull(enrollment.getCompletedAt());
        verify(enrollmentRepository).save(enrollment);
    }

    @Test
    @Order(308)
    @DisplayName("UTC08: Completing one lesson while others remain keeps enrollment ACTIVE")
    void testMarkLessonComplete_UTC08_RemainingLessonsKeepEnrollmentActive() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        when(lessonBlockRepository.findById(blockVideoId)).thenReturn(Optional.of(videoBlock));
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_IdAndLessonBlock_Id(enrollmentId, blockVideoId)).thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of());

        LessonProgressResponse response = learningService.markLessonComplete(blockVideoId);

        assertEquals(LessonProgressStatus.COMPLETED, response.status());
        assertEquals(EnrollmentStatus.ACTIVE, enrollment.getStatus());
        assertNull(enrollment.getCompletedAt());
        verify(enrollmentRepository, never()).save(any(Enrollment.class));
    }

    // ==========================================
    // 4. getCourseProgress Tests (Order: 4xx)
    // ==========================================

    @Test
    @Order(401)
    @DisplayName("UTC01: Course NOT FOUND")
    void testGetCourseProgress_UTC01_CourseNotFound() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.getCourseProgress(courseId));
        assertEquals(MessageCodes.COURSE_NOT_FOUND, ex.getMessageCode());
    }

    @Test
    @Order(402)
    @DisplayName("UTC02: Not enrolled")
    void testGetCourseProgress_UTC02_NotEnrolled() {
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(studentProfileRepository.findByUser_Id(currentUserId)).thenReturn(Optional.of(studentProfile));
        when(enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> learningService.getCourseProgress(courseId));
        assertEquals(MessageCodes.LEARNING_NOT_ENROLLED, ex.getMessageCode());
    }

    @Test
    @Order(403)
    @DisplayName("UTC03: Course has no lessons")
    void testGetCourseProgress_UTC03_NoLessons() {
        mockActiveEnrollment();

        CourseProgressSummaryResponse response = learningService.getCourseProgress(courseId);
        assertEquals(0, response.totalLessons());
        assertEquals(0, response.completedLessons());
        assertEquals(0.0, response.progressPercent());
        assertNull(response.nextLessonBlockId());
    }

    @Test
    @Order(404)
    @DisplayName("UTC04: No lesson completed yet")
    void testGetCourseProgress_UTC04_NoneCompleted() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        courseModule.addBlock(quizBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId)).thenReturn(List.of());

        CourseProgressSummaryResponse response = learningService.getCourseProgress(courseId);
        assertEquals(3, response.totalLessons());
        assertEquals(0, response.completedLessons());
        assertEquals(blockVideoId, response.nextLessonBlockId());
    }

    @Test
    @Order(405)
    @DisplayName("UTC05: Partial completion")
    void testGetCourseProgress_UTC05_PartialCompletion() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        courseModule.addBlock(quizBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId))
                .thenReturn(List.of(completedProgress(videoBlock), completedProgress(quizBlock)));

        CourseProgressSummaryResponse response = learningService.getCourseProgress(courseId);
        assertEquals(2, response.completedLessons());
        assertEquals(66.67, response.progressPercent(), 0.01);
        assertEquals(blockTextId, response.nextLessonBlockId());
        assertFalse(response.courseCompleted());
    }

    @Test
    @Order(406)
    @DisplayName("UTC06: All lessons completed - 100%")
    void testGetCourseProgress_UTC06_AllCompleted() {
        courseModule.addBlock(videoBlock);
        courseModule.addBlock(textBlock);
        courseModule.addBlock(quizBlock);
        mockActiveEnrollment();
        when(lessonProgressRepository.findByEnrollment_Id(enrollmentId))
                .thenReturn(List.of(completedProgress(videoBlock), completedProgress(textBlock), completedProgress(quizBlock)));

        CourseProgressSummaryResponse response = learningService.getCourseProgress(courseId);
        assertEquals(100.0, response.progressPercent());
        assertNull(response.nextLessonBlockId());
        assertTrue(response.courseCompleted());
    }

}
