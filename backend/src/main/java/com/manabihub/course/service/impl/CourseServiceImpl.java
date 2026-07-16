package com.manabihub.course.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;
import com.manabihub.course.dto.response.PublicCourseDetailResponse;
import com.manabihub.course.dto.response.PublicModuleResponse;
import com.manabihub.course.dto.response.PublicLessonBlockResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseLearningGoal;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.CourseService;
import com.manabihub.course.service.CourseValidationService;
import com.manabihub.course.dto.response.ValidationResultResponse;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.manabihub.audit.service.AuditLogService;
import com.manabihub.notification.service.NotificationService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {

    private static final int MIN_LEARNING_GOALS = 4;
    private static final int MAX_LEARNING_GOAL_LENGTH = 160;
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DRAFT_TITLE_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(VIETNAM_ZONE);

    private final CourseRepository courseRepository;
    private final CourseCategoryRepository courseCategoryRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final CurrentUserService currentUserService;
    private final CourseValidationService courseValidationService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    public CourseDraftResponse createDraft(CreateCourseDraftRequest request) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveApprovedTeacher(currentUserId);
        List<String> learningGoals = normalizeLearningGoals(request.learningGoals());
        validateDraftRequest(request, learningGoals);
        String title = normalizeDraftTitle(request.title());

        Course course = Course.builder()
                .teacher(teacherProfile)
                .title(title)
                .slug(generateUniqueSlug(title, null))
                .description(trim(request.introduction()))
                .introduction(trim(request.introduction()))
                .jlptLevel(request.jlptLevel())
                .category(trim(request.category()))
                .thumbnailUrl(blankToNull(request.thumbnailUrl()))
                .outcomes(trim(request.outcomes()))
                .price(request.price())
                .currency("VND")
                .prerequisites(trim(request.prerequisites()))
                .targetStudents(trim(request.targetStudents()))
                .status(CourseStatus.DRAFT)
                .aiSupported(false)
                .build();

        for (int index = 0; index < learningGoals.size(); index++) {
            course.addLearningGoal(learningGoals.get(index), index + 1);
        }

        Course savedCourse = courseRepository.save(course);
        return toResponse(savedCourse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDraftResponse> listMyDrafts() {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveApprovedTeacher(currentUserId);

        return courseRepository.findByTeacher_IdAndStatusOrderByCreatedAtDesc(
                        teacherProfile.getId(),
                        CourseStatus.DRAFT
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CourseDraftResponse updateDraft(UUID draftId, CreateCourseDraftRequest request) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveApprovedTeacher(currentUserId);
        Course course = resolveDraftForTeacher(draftId, teacherProfile.getId());
        List<String> learningGoals = normalizeLearningGoals(request.learningGoals());
        validateDraftRequest(request, learningGoals);
        String title = normalizeDraftTitle(request.title());

        course.setTitle(title);
        course.setSlug(generateUniqueSlug(title, course.getId()));
        course.setDescription(trim(request.introduction()));
        course.setIntroduction(trim(request.introduction()));
        course.setJlptLevel(request.jlptLevel());
        course.setCategory(trim(request.category()));
        course.setThumbnailUrl(blankToNull(request.thumbnailUrl()));
        course.setOutcomes(trim(request.outcomes()));
        course.setPrice(request.price());
        course.setCurrency("VND");
        course.setPrerequisites(trim(request.prerequisites()));
        course.setTargetStudents(trim(request.targetStudents()));
        course.getLearningGoals().clear();
        courseRepository.saveAndFlush(course);

        for (int index = 0; index < learningGoals.size(); index++) {
            course.addLearningGoal(learningGoals.get(index), index + 1);
        }

        return toResponse(course);
    }

    @Override
    public void deleteDraft(UUID draftId) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveApprovedTeacher(currentUserId);
        Course course = resolveDraftForTeacher(draftId, teacherProfile.getId());

        courseRepository.delete(course);
    }

    @Override
    public void submitForReview(UUID draftId) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveApprovedTeacher(currentUserId);
        Course course = resolveDraftForTeacher(draftId, teacherProfile.getId());

        if (course.getStatus() != CourseStatus.DRAFT && course.getStatus() != CourseStatus.REJECTED && course.getStatus() != CourseStatus.FORCED_DRAFT) {
            throw new BusinessException(
                    com.manabihub.common.constants.MessageCodes.COMMON_BAD_REQUEST,
                    "Không thể gửi duyệt khóa học ở trạng thái hiện tại.",
                    org.springframework.http.HttpStatus.BAD_REQUEST
            );
        }

        ValidationResultResponse validationResult = courseValidationService.validateCourse(draftId);
        if (!validationResult.isValid()) {
            throw new com.manabihub.common.exception.ValidationBusinessException(
                    "MSG-COURSE-004",
                    "Sản phẩm chưa đáp ứng điều kiện gửi duyệt.",
                    validationResult.errors()
            );
        }

        course.setStatus(CourseStatus.PENDING);
        course.setSubmittedAt(Instant.now());

        notificationService.createNotificationForRole(
                "ADMIN",
                "Course submitted for review",
                "Teacher submitted course \"" + course.getTitle() + "\" for review.",
                "COURSE_REVIEW",
                "/admin/courses/" + course.getId()
        );

        auditLogService.logUserAction(
                currentUserId,
                "TEACHER",
                "SUBMIT_COURSE",
                "COURSE",
                course.getId(),
                Map.of("status", CourseStatus.DRAFT.name()),
                Map.of("status", CourseStatus.PENDING.name()),
                Map.of("courseTitle", course.getTitle())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PublicCourseDetailResponse getPublicCourseDetail(String identifier) {
        Course course;
        try {
            UUID courseId = UUID.fromString(identifier);
            course = courseRepository.findByIdWithDetails(courseId)
                    .orElseThrow(() -> new BusinessException(
                            MessageCodes.MSG_CATALOG_001,
                            "Course was not found",
                            HttpStatus.NOT_FOUND
                    ));
        } catch (IllegalArgumentException e) {
            course = courseRepository.findBySlugWithDetails(identifier)
                    .orElseThrow(() -> new BusinessException(
                            MessageCodes.MSG_CATALOG_001,
                            "Course was not found",
                            HttpStatus.NOT_FOUND
                    ));
        }

        java.util.Optional<UUID> currentUserIdOpt = currentUserService.getCurrentUserIdOptional();

        boolean isAuthor = currentUserIdOpt.isPresent() &&
                           course.getTeacher() != null &&
                           course.getTeacher().getUser() != null &&
                           currentUserIdOpt.get().equals(course.getTeacher().getUser().getId());

        boolean isAdmin = currentUserService.hasRole("ADMIN") || currentUserService.hasRole("SUPER_ADMIN");

        if (course.getStatus() != CourseStatus.PUBLISHED && !isAuthor && !isAdmin) {
            throw new BusinessException(
                    MessageCodes.MSG_CATALOG_001,
                    "Course was not found or is not published yet",
                    HttpStatus.NOT_FOUND
            );
        }

        boolean isEnrolled = false;
        if (currentUserIdOpt.isPresent()) {
            isEnrolled = courseRepository.checkEnrollmentExists(course.getId(), currentUserIdOpt.get());
        }

        // Aggregate stats
        int totalDurationMinutes = 0;
        int totalLessons = 0;

        List<PublicModuleResponse> moduleResponses = new ArrayList<>();
        for (CourseModule module : course.getModules()) {
            PublicModuleResponse modRes = mapModuleToPublicResponse(module);
            moduleResponses.add(modRes);
            for (PublicLessonBlockResponse block : modRes.getBlocks()) {
                if ("VIDEO".equals(block.getType()) && block.getDurationMinutes() != null) {
                    totalDurationMinutes += block.getDurationMinutes();
                }
                totalLessons++;
            }
        }

        return PublicCourseDetailResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .introduction(course.getIntroduction())
                .jlptLevel(course.getJlptLevel())
                .category(course.getCategory())
                .thumbnailUrl(course.getThumbnailUrl())
                .outcomes(course.getOutcomes())
                .price(course.getPrice())
                .currency(course.getCurrency())
                .prerequisites(course.getPrerequisites())
                .targetStudents(course.getTargetStudents())
                .publishedAt(course.getPublishedAt())
                .teacher(PublicCourseDetailResponse.TeacherDto.builder()
                        .id(course.getTeacher().getId())
                        .name(course.getTeacher().getDisplayName())
                        .avatarUrl(course.getTeacher().getUser() != null ? course.getTeacher().getUser().getAvatarUrl() : null)
                        .bio(course.getTeacher().getBio())
                        .build())
                .averageRating(0.0) // Mocked as 0 for now until Review module is ready
                .totalReviews(0) // Mocked as 0 for now until Review module is ready
                .isEnrolled(isEnrolled)
                .totalDurationMinutes(totalDurationMinutes)
                .totalLessons(totalLessons)
                .modules(moduleResponses)
                .build();
    }

    private PublicModuleResponse mapModuleToPublicResponse(CourseModule module) {
        return PublicModuleResponse.builder()
                .id(module.getId())
                .title(module.getTitle())
                .orderIndex(module.getOrderIndex())
                .blocks(module.getBlocks().stream().map(this::mapBlockToPublicResponse).toList())
                .build();
    }

    private PublicLessonBlockResponse mapBlockToPublicResponse(LessonBlock block) {
        return PublicLessonBlockResponse.builder()
                .id(block.getId())
                .title(block.getTitle())
                .type(block.getType())
                .durationMinutes(block.getDurationMinutes())
                .orderIndex(block.getOrderIndex())
                .build();
    }

    private TeacherProfile resolveApprovedTeacher(UUID userId) {
        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_KYC_010,
                        "Teacher KYC must be approved before creating a course draft",
                        HttpStatus.FORBIDDEN
                ));

        if (teacherProfile.getKycStatus() != TeacherKycStatus.APPROVED || !teacherProfile.isCanPublishCourse()) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_010,
                    "Teacher KYC must be approved before creating a course draft",
                    HttpStatus.FORBIDDEN
            );
        }

        return teacherProfile;
    }

    private void validateDraftRequest(CreateCourseDraftRequest request, List<String> learningGoals) {
        if (!StringUtils.hasText(request.category())
                || !courseCategoryRepository.existsByCodeAndActiveTrue(request.category().trim())) {
            throw new BusinessException(MessageCodes.MSG_COURSE_004, "Course category is invalid");
        }

        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(MessageCodes.MSG_COURSE_003, "Course price must be zero or greater");
        }

        if (!StringUtils.hasText(request.prerequisites())) {
            throw new BusinessException(MessageCodes.MSG_GOAL_003, "Prerequisites are required");
        }

        if (!StringUtils.hasText(request.targetStudents())) {
            throw new BusinessException(MessageCodes.MSG_GOAL_004, "Target students are required");
        }

        if (learningGoals.size() < MIN_LEARNING_GOALS) {
            throw new BusinessException(MessageCodes.MSG_GOAL_001, "At least 4 learning goals are required");
        }

        boolean hasTooLongGoal = learningGoals.stream().anyMatch(goal -> goal.length() > MAX_LEARNING_GOAL_LENGTH);
        if (hasTooLongGoal) {
            throw new BusinessException(MessageCodes.MSG_GOAL_002, "Each learning goal must be at most 160 characters");
        }
    }

    private List<String> normalizeLearningGoals(List<String> learningGoals) {
        if (learningGoals == null) {
            return List.of();
        }

        List<String> normalized = new ArrayList<>();
        for (String goal : learningGoals) {
            if (!StringUtils.hasText(goal)) {
                continue;
            }
            normalized.add(goal.trim());
        }

        return normalized;
    }

    private Course resolveDraftForTeacher(UUID draftId, UUID teacherId) {
        return courseRepository.findByIdAndTeacher_IdAndStatus(draftId, teacherId, CourseStatus.DRAFT)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Course draft was not found",
                        HttpStatus.NOT_FOUND
                ));
    }

    private String normalizeDraftTitle(String title) {
        if (StringUtils.hasText(title)) {
            return title.trim();
        }

        return "[Bản nháp] Khóa học chưa đặt tên - " + DRAFT_TITLE_DATE_FORMATTER.format(Instant.now());
    }

    private String generateUniqueSlug(String title, UUID currentCourseId) {
        String baseSlug = toSlug(title);
        if (baseSlug.isBlank()) {
            baseSlug = "course";
        }

        String candidate = baseSlug;
        int suffix = 2;
        while (slugExists(candidate, currentCourseId)) {
            candidate = baseSlug + "-" + suffix;
            suffix++;
        }

        return candidate;
    }

    private boolean slugExists(String slug, UUID currentCourseId) {
        if (currentCourseId == null) {
            return courseRepository.existsBySlug(slug);
        }

        return courseRepository.existsBySlugAndIdNot(slug, currentCourseId);
    }

    private String toSlug(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replace("đ", "d")
                .replace("Đ", "D")
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

        return normalized.length() > 200 ? normalized.substring(0, 200).replaceAll("-$", "") : normalized;
    }

    private CourseDraftResponse toResponse(Course course) {
        List<String> learningGoals = course.getLearningGoals().stream()
                .map(CourseLearningGoal::getGoalText)
                .toList();

        return new CourseDraftResponse(
                course.getId(),
                course.getTeacher().getId(),
                course.getTitle(),
                course.getSlug(),
                course.getIntroduction(),
                course.getJlptLevel(),
                course.getCategory(),
                course.getThumbnailUrl(),
                course.getOutcomes(),
                course.getPrice(),
                course.getCurrency(),
                course.getPrerequisites(),
                course.getTargetStudents(),
                course.getStatus(),
                learningGoals,
                course.getCreatedAt(),
                srsTrace()
        );
    }

    private Map<String, Object> srsTrace() {
        return Map.of(
                "uc", "UC-23",
                "br", List.of(
                        "BR-PROD-04",
                        "BR-PROD-05",
                        "BR-GOAL-01",
                        "BR-GOAL-02",
                        "BR-GOAL-03",
                        "BR-GOAL-04",
                        "BR-GOAL-05",
                        "BR-COURSE-01",
                        "BR-COURSE-03",
                        "BR-COURSE-04",
                        "BR-COURSE-05"
                ),
                "msg", List.of(
                        MessageCodes.MSG_COURSE_001,
                        MessageCodes.MSG_COURSE_003,
                        MessageCodes.MSG_COURSE_004,
                        MessageCodes.MSG_GOAL_001,
                        MessageCodes.MSG_GOAL_002,
                        MessageCodes.MSG_GOAL_003,
                        MessageCodes.MSG_GOAL_004,
                        MessageCodes.MSG_KYC_010
                )
        );
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

}
