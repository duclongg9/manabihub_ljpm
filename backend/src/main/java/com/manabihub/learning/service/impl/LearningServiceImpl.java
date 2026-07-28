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
import com.manabihub.learning.enums.FlashcardStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.repository.FlashcardProgressRepository;
import com.manabihub.learning.repository.LessonBlockProgressRepository;
import com.manabihub.learning.service.LearningService;
import com.manabihub.learning.service.CertificateEligibilityService;
import com.manabihub.learning.service.StudentAssessmentService;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import com.manabihub.writing.entity.AiWritingSuggestion;
import com.manabihub.writing.repository.AiWritingSuggestionRepository;
import com.manabihub.writing.entity.TeacherWritingFeedback;
import com.manabihub.writing.repository.TeacherWritingFeedbackRepository;
import com.manabihub.ai.repository.AiUsageLogRepository;
import com.manabihub.ai.service.AiChatSettingsService;
import com.manabihub.ai.service.AiUsageLogService;
import com.manabihub.ai.enums.AiUsageRequestStatus;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.dto.request.WritingSubmissionRequest;
import com.manabihub.writing.dto.response.StudentWritingSubmissionResponse;
import com.manabihub.writing.dto.response.AiWritingSuggestionResponse;
import com.manabihub.writing.dto.response.TeacherWritingFeedbackResponse;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import com.manabihub.ai.provider.AiWritingAssistanceProvider;
import com.manabihub.ai.provider.AiChatProviderException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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
    private final FlashcardProgressRepository flashcardProgressRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;
    private final WritingSubmissionRepository writingSubmissionRepository;
    private final AiWritingSuggestionRepository aiWritingSuggestionRepository;
    private final TeacherWritingFeedbackRepository teacherWritingFeedbackRepository;
    private final AiChatSettingsService aiChatSettingsService;
    private final AiUsageLogService aiUsageLogService;
    private final TransactionTemplate transactionTemplate;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final AiWritingAssistanceProvider aiWritingAssistanceProvider;
    private final StudentAssessmentService studentAssessmentService;
    private final CertificateEligibilityService certificateEligibilityService;

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

        boolean courseCompleted = completedLessons == allBlocks.size();
        UUID currentLessonBlockId = allBlocks.stream()
                .filter(block -> !isCompleted(progressByBlockId.get(block.getId())))
                .map(LessonBlock::getId)
                .findFirst()
                .orElse(null);

        List<String> warnings = new ArrayList<>();

        Map<UUID, List<com.manabihub.learning.entity.FlashcardProgress>> flashcardProgressByBlockId = flashcardProgressRepository.findByEnrollmentId(enrollment.getId())
                .stream()
                .collect(Collectors.groupingBy(com.manabihub.learning.entity.FlashcardProgress::getLessonBlockId));

        List<LearningModuleResponse> moduleResponses = sortedModules(course).stream()
                .map(module -> toModuleResponse(module, progressByBlockId, currentLessonBlockId, warnings, flashcardProgressByBlockId))
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
    public LessonProgressResponse reviewFlashcard(UUID lessonBlockId, com.manabihub.learning.dto.request.ReviewFlashcardRequest request) {
        LessonBlock block = resolveLessonBlock(lessonBlockId);
        Enrollment enrollment = resolveActiveEnrollment(block.getModule().getCourse().getId());

        if (block.getType() != LessonBlockType.FLASHCARD) {
            throw new BusinessException(MessageCodes.LEARNING_INVALID_BLOCK_TYPE, "Block is not a flashcard", HttpStatus.BAD_REQUEST);
        }

        List<FlashcardItemResponse> flashcards = readJsonList(block.getFlashcardsJson(), FLASHCARDS_TYPE);
        int totalCards = flashcards.size();
        if (request.cardIndex() < 0 || request.cardIndex() >= totalCards) {
            throw new BusinessException(MessageCodes.LEARNING_INVALID_FLASHCARD_INDEX, "Invalid card index", HttpStatus.BAD_REQUEST);
        }

        // Acquire PESSIMISTIC_WRITE lock on the enrollment row to serialize
        // concurrent reviews for the same enrollment, preventing lost completions
        // or duplicate LessonBlockProgress rows.
        enrollmentRepository.findByIdForUpdate(enrollment.getId())
                .orElseThrow(() -> new BusinessException(MessageCodes.LEARNING_NOT_ENROLLED, "Enrollment not found", HttpStatus.FORBIDDEN));

        flashcardProgressRepository.upsertStatus(enrollment.getId(), lessonBlockId, request.cardIndex(), request.status());

        int classifiedCount = flashcardProgressRepository.countByEnrollmentIdAndLessonBlockId(enrollment.getId(), lessonBlockId);

        LessonBlockProgress progress = resolveOrCreateProgress(enrollment, block);

        if (classifiedCount >= totalCards) {
            progress.setStatus(LessonProgressStatus.COMPLETED);
            progress.setCompletedAt(Instant.now());
        } else if (progress.getStatus() == LessonProgressStatus.NOT_STARTED) {
            progress.setStatus(LessonProgressStatus.IN_PROGRESS);
        }

        progress = lessonBlockProgressRepository.save(progress);

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
        boolean courseCompleted = !allBlocks.isEmpty() && nextLesson == null;

        return new CourseProgressSummaryResponse(
                course.getId(),
                course.getTitle(),
                allBlocks.size(),
                completedLessons,
                progressPercent(completedLessons, allBlocks.size()),
                nextLesson != null ? nextLesson.getId() : null,
                nextLesson != null ? nextLesson.getTitle() : null,
                courseCompleted,
                studentAssessmentService.getFinalTestEligibility(courseId),
                certificateEligibilityService.evaluate(enrollment, allBlocks, progressByBlockId)
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
                .filter(block -> !block.isModerationHidden())
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
            List<String> warnings,
            Map<UUID, List<com.manabihub.learning.entity.FlashcardProgress>> flashcardProgressByBlockId
    ) {
        List<LearningLessonBlockResponse> blockResponses = sortedBlocks(module).stream()
                .map(block -> toBlockResponse(module, block, progressByBlockId.get(block.getId()), currentLessonBlockId, warnings, flashcardProgressByBlockId.getOrDefault(block.getId(), List.of())))
                .toList();

        return new LearningModuleResponse(module.getId(), module.getTitle(), module.getOrderIndex(), blockResponses);
    }

    private LearningLessonBlockResponse toBlockResponse(
            CourseModule module,
            LessonBlock block,
            LessonBlockProgress progress,
            UUID currentLessonBlockId,
            List<String> warnings,
            List<com.manabihub.learning.entity.FlashcardProgress> flashcardProgresses
    ) {
        boolean contentAvailable = isContentAvailable(block);
        if (!contentAvailable) {
            log.warn("[{}] Lesson block {} in course {} is missing required content", MessageCodes.LEARNING_LESSON_CONTENT_UNAVAILABLE, block.getId(), module.getCourse().getId());
            warnings.add("Bài học \"" + block.getTitle() + "\" hiện chưa có đủ nội dung.");
        }

        List<String> quizOptions = readJsonList(block.getQuizOptionsJson(), QUIZ_OPTIONS_TYPE);

        List<FlashcardItemResponse> flashcards = readJsonList(block.getFlashcardsJson(), FLASHCARDS_TYPE);
        List<FlashcardStatus> flashcardStatuses = null;
        if (block.getType() == LessonBlockType.FLASHCARD) {
            Map<Integer, FlashcardStatus> statusMap = flashcardProgresses.stream()
                    .collect(Collectors.toMap(com.manabihub.learning.entity.FlashcardProgress::getCardIndex, com.manabihub.learning.entity.FlashcardProgress::getStatus));
            flashcardStatuses = new ArrayList<>();
            for (int i = 0; i < flashcards.size(); i++) {
                flashcardStatuses.add(statusMap.get(i));
            }
        }

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
                flashcards,
                flashcardStatuses,
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
                .filter(block -> !block.isModerationHidden())
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

    // ──────────────── Writing Assignment Methods ────────────────────────────────────────

    @Override
    public StudentWritingSubmissionResponse getWritingSubmission(UUID lessonBlockId) {
        LessonBlock block = resolveLessonBlock(lessonBlockId);
        Enrollment enrollment = resolveActiveEnrollment(block.getModule().getCourse().getId());

        if (block.getType() != LessonBlockType.WRITING) {
            throw new BusinessException(MessageCodes.LEARNING_INVALID_BLOCK_TYPE, "Not a writing block", HttpStatus.BAD_REQUEST);
        }

        return writingSubmissionRepository.findByEnrollmentIdAndLessonBlockId(enrollment.getId(), lessonBlockId)
                .map(this::mapToWritingSubmissionDetailResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public StudentWritingSubmissionResponse submitWriting(UUID lessonBlockId, WritingSubmissionRequest request) {
        LessonBlock block = resolveLessonBlock(lessonBlockId);
        // Pessimistic lock enrollment to prevent race conditions during submission processing
        Enrollment enrollment = enrollmentRepository.findByIdForUpdate(resolveActiveEnrollment(block.getModule().getCourse().getId()).getId())
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Enrollment not found", HttpStatus.NOT_FOUND));

        if (block.getType() != LessonBlockType.WRITING) {
            throw new BusinessException(MessageCodes.LEARNING_INVALID_BLOCK_TYPE, "Not a writing block", HttpStatus.BAD_REQUEST);
        }

        WritingSubmission submission = WritingSubmission.builder()
                .enrollment(enrollment)
                .student(enrollment.getStudent())
                .lessonBlockId(lessonBlockId)
                .legacyLessonId(null)
                .content(request.content())
                .status(WritingSubmissionStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();

        try {
            submission = writingSubmissionRepository.saveAndFlush(submission);
        } catch (DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            if (msg != null && msg.contains("uq_writing_submissions_enrollment_block")) {
                throw new BusinessException(MessageCodes.COMMON_CONFLICT, "You have already submitted this assignment.", HttpStatus.CONFLICT);
            }
            throw e;
        }

        // Upsert progress to COMPLETED
        LessonBlockProgress progress = lessonBlockProgressRepository
                .findByEnrollmentIdAndLessonBlockId(enrollment.getId(), block.getId())
                .orElseGet(() -> LessonBlockProgress.builder()
                        .enrollmentId(enrollment.getId())
                        .lessonBlockId(block.getId())
                        .status(LessonProgressStatus.IN_PROGRESS)
                        .build());

        progress.setStatus(LessonProgressStatus.COMPLETED);
        if (progress.getCompletedAt() == null) {
            progress.setCompletedAt(Instant.now());
        }
        lessonBlockProgressRepository.save(progress);

        return mapToWritingSubmissionDetailResponse(submission);
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public StudentWritingSubmissionResponse requestAiWritingAssistance(UUID lessonBlockId, UUID submissionId) {
        WritingSubmission preCheckSub = transactionTemplate.execute(status -> {
            LessonBlock block = resolveLessonBlock(lessonBlockId);
            Enrollment enrollment = resolveActiveEnrollment(block.getModule().getCourse().getId());
            return writingSubmissionRepository.findByIdAndEnrollmentIdAndLessonBlockId(submissionId, enrollment.getId(), lessonBlockId)
                    .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Submission not found", HttpStatus.NOT_FOUND));
        });

        UUID currentUserId = currentUserService.getCurrentUserId();
        Course course = preCheckSub.getEnrollment().getCourse();
        AiChatSettingsService.AiChatSettings settings = aiChatSettingsService.getSettings();

        // 1. Validate Eligibility
        if (!settings.aiEnabled() || !settings.aiWritingEnabled() || !course.isAiSupported()) {
            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.BLOCKED, null, 0, 0, "Feature disabled");
            throw new BusinessException(MessageCodes.AI_NOT_AVAILABLE_FOR_COURSE, "AI writing assistance is not available for this course.", HttpStatus.FORBIDDEN);
        }

        if (course.getPrice() == null || course.getPrice().compareTo(settings.priceFloor()) < 0) {
            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.BLOCKED, null, 0, 0, "Price floor not met");
            throw new BusinessException(MessageCodes.AI_NOT_AVAILABLE_FOR_COURSE, "AI writing assistance is unavailable for this course plan.", HttpStatus.FORBIDDEN);
        }

        // 2. Rate Limits (Minute and Daily)
        Instant oneMinuteAgo = Instant.now().minusSeconds(60);
        long requestsLastMinute = aiUsageLogRepository.countByUserIdAndFeatureCodeAndRequestStatusAndCreatedAtAfter(currentUserId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.SUCCESS, oneMinuteAgo);
        if (requestsLastMinute >= settings.rateLimitPerMinute()) {
            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.BLOCKED, null, 0, 0, "Rate limit exceeded (minute)");
            throw new BusinessException(MessageCodes.MSG_AI_001, "Too many AI requests. Please wait a moment.", HttpStatus.TOO_MANY_REQUESTS);
        }

        Instant oneDayAgo = Instant.now().minusSeconds(86400);
        long requestsLastDay = aiUsageLogRepository.countByUserIdAndFeatureCodeAndRequestStatusAndCreatedAtAfter(currentUserId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.SUCCESS, oneDayAgo);
        if (requestsLastDay >= settings.dailyLimit()) {
            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.BLOCKED, null, 0, 0, "Rate limit exceeded (daily)");
            throw new BusinessException(MessageCodes.MSG_AI_001, "You have reached your daily AI usage limit.", HttpStatus.TOO_MANY_REQUESTS);
        }

        // 3. Status Check & Pre-saving (In a new transaction to persist SUGGESTION_PROCESSING state before provider call)
        boolean canProcess = transactionTemplate.execute(status -> {
            WritingSubmission currentSub = writingSubmissionRepository.findByIdAndEnrollmentIdAndLessonBlockIdForUpdate(submissionId, preCheckSub.getEnrollment().getId(), lessonBlockId)
                    .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Submission not found", HttpStatus.NOT_FOUND));

            if (currentSub.getStatus() == WritingSubmissionStatus.SUGGESTION_PROCESSING ||
                currentSub.getStatus() == WritingSubmissionStatus.SUGGESTION_READY ||
                currentSub.getStatus() == WritingSubmissionStatus.TEACHER_FEEDBACK_READY) {
                return false;
            }
            currentSub.setStatus(WritingSubmissionStatus.SUGGESTION_PROCESSING);
            writingSubmissionRepository.saveAndFlush(currentSub);
            return true;
        });

        if (Boolean.FALSE.equals(canProcess)) {
            WritingSubmission currentSub = writingSubmissionRepository.findById(submissionId).orElseThrow();
            return mapToWritingSubmissionDetailResponse(currentSub);
        }

        // 4. Provider Call
        WritingSubmission submission = writingSubmissionRepository.findById(submissionId).orElseThrow();
        LessonBlock block = lessonBlockRepository.findById(lessonBlockId).orElseThrow();
        try {
            AiWritingAssistanceProvider.Result result = aiWritingAssistanceProvider.generate(
                    block.getWritingPrompt(),
                    block.getRubric(),
                    submission.getContent()
            );

            transactionTemplate.executeWithoutResult(status -> {
                WritingSubmission sub = writingSubmissionRepository.findById(submissionId).orElseThrow();
                sub.setStatus(WritingSubmissionStatus.SUGGESTION_READY);
                writingSubmissionRepository.save(sub);

                AiWritingSuggestion suggestion = AiWritingSuggestion.builder()
                        .writingSubmission(sub)
                        .provider(result.provider())
                        .status("READY")
                        .grammarSuggestions(result.grammarSuggestions())
                        .vocabularySuggestions(result.vocabularySuggestions())
                        .structureSuggestions(result.structureSuggestions())
                        .revisionGuidance(result.revisionGuidance())
                        .official(false)
                        .build();
                aiWritingSuggestionRepository.save(suggestion);
            });

            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.SUCCESS, result.provider(), result.inputTokens(), result.outputTokens(), null);

        } catch (AiChatProviderException e) {
            transactionTemplate.executeWithoutResult(status -> {
                WritingSubmission sub = writingSubmissionRepository.findById(submissionId).orElseThrow();
                sub.setStatus(WritingSubmissionStatus.SUGGESTION_FAILED);
                writingSubmissionRepository.save(sub);

                AiWritingSuggestion suggestion = AiWritingSuggestion.builder()
                        .writingSubmission(sub)
                        .status("FAILED")
                        .grammarSuggestions(objectMapper.createArrayNode())
                        .vocabularySuggestions(objectMapper.createArrayNode())
                        .structureSuggestions(objectMapper.createArrayNode())
                        .failureReason("Provider error")
                        .official(false)
                        .build();
                aiWritingSuggestionRepository.save(suggestion);
            });

            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.FAILED, null, 0, 0, "Provider error");
            throw new BusinessException(MessageCodes.MSG_AI_002, "AI provider is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            transactionTemplate.executeWithoutResult(status -> {
                WritingSubmission sub = writingSubmissionRepository.findById(submissionId).orElseThrow();
                sub.setStatus(WritingSubmissionStatus.SUGGESTION_FAILED);
                writingSubmissionRepository.save(sub);

                AiWritingSuggestion suggestion = AiWritingSuggestion.builder()
                        .writingSubmission(sub)
                        .status("FAILED")
                        .grammarSuggestions(objectMapper.createArrayNode())
                        .vocabularySuggestions(objectMapper.createArrayNode())
                        .structureSuggestions(objectMapper.createArrayNode())
                        .failureReason("Internal error")
                        .official(false)
                        .build();
                aiWritingSuggestionRepository.save(suggestion);
            });

            aiUsageLogService.record(currentUserId, course.getId(), lessonBlockId, submissionId, "AI_WRITING_ASSISTANCE", AiUsageRequestStatus.FAILED, null, 0, 0, "Internal error");
            throw new BusinessException(MessageCodes.MSG_AI_002, "AI processing failed due to an internal error", HttpStatus.SERVICE_UNAVAILABLE);
        }

        return mapToWritingSubmissionDetailResponse(writingSubmissionRepository.findById(submissionId).orElse(submission));
    }

    private StudentWritingSubmissionResponse mapToWritingSubmissionDetailResponse(WritingSubmission submission) {
        AiWritingSuggestion suggestion = aiWritingSuggestionRepository.findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submission.getId()).orElse(null);
        AiWritingSuggestionResponse suggestionResponse = suggestion == null ? null : new AiWritingSuggestionResponse(
                suggestion.getId(),
                suggestion.getStatus(),
                suggestion.getGrammarSuggestions(),
                suggestion.getVocabularySuggestions(),
                suggestion.getStructureSuggestions(),
                suggestion.getRevisionGuidance(),
                suggestion.getConfidenceLevel(),
                suggestion.isOfficial(),
                suggestion.getFailureReason(),
                suggestion.getCreatedAt()
        );

        TeacherWritingFeedback feedback = teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submission.getId())
                .orElse(null);
        TeacherWritingFeedbackResponse feedbackResponse = feedback == null ? null : new TeacherWritingFeedbackResponse(
                feedback.getId(),
                feedback.getScore(),
                feedback.getComment(),
                feedback.getRubricResult(),
                feedback.isOfficial(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt()
        );

        return new StudentWritingSubmissionResponse(
                submission.getId(),
                submission.getLessonBlockId(),
                submission.getContent(),
                submission.getStatus(),
                submission.getSubmittedAt(),
                suggestionResponse,
                feedbackResponse
        );
    }
}
