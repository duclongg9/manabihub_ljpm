package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.response.FlashcardItemResponse;
import com.manabihub.learning.dto.internal.InternalQuizQuestionDto;
import com.manabihub.learning.dto.response.StudentQuizQuestionResponse;
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
import com.manabihub.learning.dto.response.LearningModuleResponse;
import com.manabihub.learning.dto.response.LessonProgressResponse;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.entity.LessonBlockProgress;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.enums.LessonProgressStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.repository.LessonBlockProgressRepository;
import com.manabihub.learning.service.LearningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LearningServiceImpl implements LearningService {

    private static final TypeReference<List<String>> QUIZ_OPTIONS_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<InternalQuizQuestionDto>> QUIZ_ITEMS_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<FlashcardItemResponse>> FLASHCARDS_TYPE = new TypeReference<>() {
    };

    private final CourseRepository courseRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonBlockProgressRepository lessonBlockProgressRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Override
    public CourseLearningResponse openOrResumeCourse(UUID courseId) {
        Enrollment enrollment = resolveActiveEnrollment(courseId);
        Course course = enrollment.getCourse();
        List<LessonBlock> allBlocks = flattenBlocks(course);

        if (allBlocks.isEmpty()) {
            log.warn("[{}] Course {} has no lesson content available", MessageCodes.LEARNING_LESSON_CONTENT_UNAVAILABLE, courseId);
            return new CourseLearningResponse(
                    course.getId(),
                    course.getTitle(),
                    enrollment.getId(),
                    List.of(),
                    null,
                    0,
                    0,
                    0.0,
                    false,
                    List.of("Khoá học chưa có nội dung bài học.")
            );
        }

        Map<UUID, LessonBlockProgress> progressByBlockId = lessonBlockProgressRepository.findByEnrollmentId(enrollment.getId())
                .stream()
                .collect(Collectors.toMap(progress -> progress.getLessonBlockId(), Function.identity()));

        int completedLessons = (int) allBlocks.stream()
                .filter(block -> isCompleted(progressByBlockId.get(block.getId())))
                .count();

        UUID currentLessonBlockId = allBlocks.stream()
                .filter(block -> !isCompleted(progressByBlockId.get(block.getId())))
                .map(LessonBlock::getId)
                .findFirst()
                .orElse(null);
        boolean courseCompleted = completedLessons == allBlocks.size();

        List<String> warnings = new ArrayList<>();
        List<LearningModuleResponse> moduleResponses = sortedModules(course).stream()
                .map(module -> toModuleResponse(module, progressByBlockId, currentLessonBlockId, warnings))
                .toList();

        return new CourseLearningResponse(
                course.getId(),
                course.getTitle(),
                enrollment.getId(),
                moduleResponses,
                currentLessonBlockId,
                allBlocks.size(),
                completedLessons,
                progressPercent(completedLessons, allBlocks.size()),
                courseCompleted,
                warnings
        );
    }

    @Override
    @Transactional
    public LessonProgressResponse saveVideoProgress(UUID lessonBlockId, SaveVideoProgressRequest request) {
        LessonBlock block = resolveLessonBlock(lessonBlockId);
        Enrollment enrollment = resolveActiveEnrollment(block.getModule().getCourse().getId());

        if (block.getType() != LessonBlockType.VIDEO) {
            throw new BusinessException(
                    MessageCodes.LEARNING_INVALID_BLOCK_TYPE,
                    "Only VIDEO lesson blocks support video progress tracking",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (!StringUtils.hasText(block.getVideoUrl())) {
            log.warn("[{}] Video content missing for lesson block {}", MessageCodes.LEARNING_LESSON_CONTENT_UNAVAILABLE, lessonBlockId);
            throw new BusinessException(
                    MessageCodes.LEARNING_LESSON_CONTENT_UNAVAILABLE,
                    "Video content is missing for this lesson",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

        if (block.getDurationMinutes() != null && request.positionSeconds() > block.getDurationMinutes() * 60) {
            throw new BusinessException(
                    MessageCodes.LEARNING_INVALID_VIDEO_POSITION,
                    "Video position exceeds the lesson duration",
                    HttpStatus.BAD_REQUEST
            );
        }

        LessonBlockProgress progress = resolveOrCreateProgress(enrollment, block);
        progress.setLastVideoPositionSeconds(request.positionSeconds());
        if (progress.getStatus() == LessonProgressStatus.NOT_STARTED) {
            progress.setStatus(LessonProgressStatus.IN_PROGRESS);
        }

        lessonBlockProgressRepository.save(progress);
        return toProgressResponse(progress);
    }

    @Override
    @Transactional
    public LessonProgressResponse markLessonComplete(UUID lessonBlockId) {
        LessonBlock block = resolveLessonBlock(lessonBlockId);
        if (block.getType() != LessonBlockType.VIDEO && block.getType() != LessonBlockType.TEXT) {
            throw new BusinessException(
                    MessageCodes.COMMON_BAD_REQUEST,
                    "Cannot mark " + block.getType() + " block as complete through this endpoint.",
                    HttpStatus.BAD_REQUEST
            );
        }

        Enrollment enrollment = resolveActiveEnrollment(block.getModule().getCourse().getId());

        LessonBlockProgress progress = resolveOrCreateProgress(enrollment, block);
        if (progress.getStatus() != LessonProgressStatus.COMPLETED) {
            progress.setStatus(LessonProgressStatus.COMPLETED);
            progress.setCompletedAt(Instant.now());
        }

        lessonBlockProgressRepository.save(progress);
        // MHB-25: Do not set EnrollmentStatus.COMPLETED. This belongs to MHB-26/27.
        return toProgressResponse(progress);
    }

    @Override
    public CourseProgressSummaryResponse getCourseProgress(UUID courseId) {
        Enrollment enrollment = resolveActiveEnrollment(courseId);
        Course course = enrollment.getCourse();
        List<LessonBlock> allBlocks = flattenBlocks(course);

        if (allBlocks.isEmpty()) {
            return new CourseProgressSummaryResponse(course.getId(), course.getTitle(), 0, 0, 0.0, null, null, false);
        }

        Map<UUID, LessonBlockProgress> progressByBlockId = lessonBlockProgressRepository.findByEnrollmentId(enrollment.getId())
                .stream()
                .collect(Collectors.toMap(progress -> progress.getLessonBlockId(), Function.identity()));

        int completedLessons = (int) allBlocks.stream()
                .filter(block -> isCompleted(progressByBlockId.get(block.getId())))
                .count();

        LessonBlock nextLesson = allBlocks.stream()
                .filter(block -> !isCompleted(progressByBlockId.get(block.getId())))
                .findFirst()
                .orElse(null);
        boolean courseCompleted = nextLesson == null;

        return new CourseProgressSummaryResponse(
                course.getId(),
                course.getTitle(),
                allBlocks.size(),
                completedLessons,
                progressPercent(completedLessons, allBlocks.size()),
                courseCompleted ? null : nextLesson.getId(),
                courseCompleted ? null : nextLesson.getTitle(),
                courseCompleted
        );
    }

    private Enrollment resolveActiveEnrollment(UUID courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COURSE_NOT_FOUND,
                        "Course was not found",
                        HttpStatus.NOT_FOUND
                ));

        StudentProfile studentProfile = resolveStudentProfile();

        return enrollmentRepository.findByStudent_IdAndCourse_Id(studentProfile.getId(), courseId)
                .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.ACTIVE
                        || enrollment.getStatus() == EnrollmentStatus.COMPLETED)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_NOT_ENROLLED,
                        "You are not enrolled in this course",
                        HttpStatus.FORBIDDEN
                ));
    }

    private StudentProfile resolveStudentProfile() {
        UUID currentUserId = currentUserService.getCurrentUserId();

        return studentProfileRepository.findByUser_Id(currentUserId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_NOT_ENROLLED,
                        "You are not enrolled in this course",
                        HttpStatus.FORBIDDEN
                ));
    }



    private LessonBlock resolveLessonBlock(UUID lessonBlockId) {
        return lessonBlockRepository.findById(lessonBlockId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.CONTENT_NOT_FOUND,
                        "Lesson block was not found",
                        HttpStatus.NOT_FOUND
                ));
    }

    private LessonBlockProgress resolveOrCreateProgress(Enrollment enrollment, LessonBlock block) {
        return lessonBlockProgressRepository.findByEnrollmentIdAndLessonBlockId(enrollment.getId(), block.getId())
                .orElseGet(() -> LessonBlockProgress.builder()
                        .enrollmentId(enrollment.getId())
                        .lessonBlockId(block.getId())
                        .status(LessonProgressStatus.NOT_STARTED)
                        .build());
    }

    private boolean isCompleted(LessonBlockProgress progress) {
        return progress != null && progress.getStatus() == LessonProgressStatus.COMPLETED;
    }

    private LearningModuleResponse toModuleResponse(
            CourseModule module,
            Map<UUID, LessonBlockProgress> progressByBlockId,
            UUID currentLessonBlockId,
            List<String> warnings
    ) {
        List<LearningLessonBlockResponse> blockResponses = sortedBlocks(module).stream()
                .map(block -> toBlockResponse(module, block, progressByBlockId.get(block.getId()), currentLessonBlockId, warnings))
                .toList();

        return new LearningModuleResponse(module.getId(), module.getTitle(), module.getOrderIndex(), blockResponses);
    }

    private LearningLessonBlockResponse toBlockResponse(
            CourseModule module,
            LessonBlock block,
            LessonBlockProgress progress,
            UUID currentLessonBlockId,
            List<String> warnings
    ) {
        boolean contentAvailable = isContentAvailable(block);
        if (!contentAvailable) {
            log.warn("[{}] Lesson block {} in course {} is missing required content", MessageCodes.LEARNING_LESSON_CONTENT_UNAVAILABLE, block.getId(), module.getCourse().getId());
            warnings.add("Bài học \"" + block.getTitle() + "\" hiện chưa có đủ nội dung.");
        }

        List<String> quizOptions = readJsonList(block.getQuizOptionsJson(), QUIZ_OPTIONS_TYPE);

        return new LearningLessonBlockResponse(
                block.getId(),
                module.getId(),
                block.getType(),
                block.getTitle(),
                block.getContent(),
                block.getVideoUrl(),
                block.getDurationMinutes(),
                block.getQuizQuestion(),
                quizOptions,
                readQuizItems(block, quizOptions),
                readJsonList(block.getFlashcardsJson(), FLASHCARDS_TYPE),
                block.getWritingPrompt(),
                block.getRubric(),
                block.getOrderIndex(),
                contentAvailable,
                progress != null ? progress.getStatus() : LessonProgressStatus.NOT_STARTED,
                progress != null ? progress.getLastVideoPositionSeconds() : null,
                progress != null ? progress.getCompletedAt() : null,
                block.getId().equals(currentLessonBlockId)
        );
    }

    private boolean isContentAvailable(LessonBlock block) {
        return switch (block.getType()) {
            case VIDEO -> StringUtils.hasText(block.getVideoUrl());
            case TEXT -> StringUtils.hasText(block.getContent());
            case QUIZ -> StringUtils.hasText(block.getQuizQuestion()) || StringUtils.hasText(block.getQuizItemsJson());
            case FLASHCARD -> StringUtils.hasText(block.getFlashcardsJson());
            case WRITING -> StringUtils.hasText(block.getWritingPrompt());
        };
    }

    private LessonProgressResponse toProgressResponse(LessonBlockProgress progress) {
        return new LessonProgressResponse(
                progress.getLessonBlockId(),
                progress.getEnrollmentId(),
                progress.getStatus(),
                progress.getLastVideoPositionSeconds(),
                progress.getCompletedAt(),
                progress.getUpdatedAt()
        );
    }

    private List<LessonBlock> flattenBlocks(Course course) {
        return sortedModules(course).stream()
                .flatMap(module -> sortedBlocks(module).stream())
                .toList();
    }

    private List<CourseModule> sortedModules(Course course) {
        return course.getModules().stream()
                .sorted(Comparator.comparingInt(CourseModule::getOrderIndex))
                .toList();
    }

    private List<LessonBlock> sortedBlocks(CourseModule module) {
        return module.getBlocks().stream()
                .sorted(Comparator.comparingInt(LessonBlock::getOrderIndex))
                .toList();
    }

    private double progressPercent(int completed, int total) {
        if (total == 0) {
            return 0.0;
        }
        return Math.round(completed * 10000.0 / total) / 100.0;
    }

    private List<StudentQuizQuestionResponse> readQuizItems(LessonBlock block, List<String> fallbackOptions) {
        List<InternalQuizQuestionDto> quizItems = readJsonList(block.getQuizItemsJson(), QUIZ_ITEMS_TYPE);
        if (!quizItems.isEmpty()) {
            return quizItems.stream()
                    .map(q -> new StudentQuizQuestionResponse(q.question(), q.options()))
                    .toList();
        }
        if (StringUtils.hasText(block.getQuizQuestion()) && !fallbackOptions.isEmpty()) {
            return List.of(new StudentQuizQuestionResponse(block.getQuizQuestion(), fallbackOptions));
        }
        return List.of();
    }

    private <T> List<T> readJsonList(String json, TypeReference<List<T>> typeReference) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }

        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }
}
