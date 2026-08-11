package com.manabihub.course.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;
import com.manabihub.course.dto.response.PublicCourseDetailResponse;
import com.manabihub.course.dto.response.PublicCourseSummaryResponse;
import com.manabihub.course.dto.response.PublicModuleResponse;
import com.manabihub.course.dto.response.PublicLessonBlockResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseLearningGoal;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.repository.PublicCourseSpecification;
import com.manabihub.course.service.CourseService;
import com.manabihub.course.service.CourseValidationService;
import com.manabihub.course.dto.response.ValidationResultResponse;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.course.dto.response.TeacherCourseAnalyticsResponse;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.manabihub.audit.service.AuditLogService;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.notification.NotificationTypes;
import com.manabihub.review.dto.response.CourseReviewAggregateResponse;
import com.manabihub.review.service.CourseReviewService;
import com.manabihub.systemconfig.service.SystemSettingValueService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

    private static final int DEFAULT_MIN_LEARNING_GOALS = 4;
    private static final int DEFAULT_MAX_LEARNING_GOAL_LENGTH = 160;
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
    private final CourseReviewService courseReviewService;
    private final SystemSettingValueService settingValueService;
    private final EnrollmentRepository enrollmentRepository;
    private final EscrowLedgerRepository escrowLedgerRepository;

    @Override
    public CourseDraftResponse createDraft(CreateCourseDraftRequest request) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);
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
                .accessDurationDays(normalizeAccessDuration(request.accessDurationDays()))
                .accessExpiresAt(request.accessExpiresAt())
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
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);

        return courseRepository.findByTeacher_IdAndStatusOrderByCreatedAtDesc(
                        teacherProfile.getId(),
                        CourseStatus.DRAFT
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDraftResponse> listMyCourses() {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);

        return courseRepository.findByTeacher_IdAndStatusNotOrderByCreatedAtDesc(
                        teacherProfile.getId(),
                        CourseStatus.ARCHIVED
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public com.manabihub.course.dto.response.TeacherDashboardResponse getTeacherDashboardStats() {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);

        List<Course> allCourses = courseRepository.findByTeacher_IdAndStatusNotOrderByCreatedAtDesc(
                teacherProfile.getId(), CourseStatus.ARCHIVED);

        long totalCourses = allCourses.size();
        long draftOrCorrection = allCourses.stream()
                .filter(c -> c.getStatus() == CourseStatus.DRAFT || c.getStatus() == CourseStatus.FORCED_DRAFT || c.getStatus() == CourseStatus.REJECTED)
                .count();
        long pendingApproval = allCourses.stream()
                .filter(c -> c.getStatus() == CourseStatus.PENDING)
                .count();
        long published = allCourses.stream()
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                .count();

        List<CourseDraftResponse> recentCourses = allCourses.stream()
                .limit(4)
                .map(this::toResponse)
                .toList();

        return com.manabihub.course.dto.response.TeacherDashboardResponse.builder()
                .totalCourses(totalCourses)
                .draftOrCorrection(draftOrCorrection)
                .pendingApproval(pendingApproval)
                .published(published)
                .recentCourses(recentCourses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherCourseAnalyticsResponse getCourseAnalytics(UUID courseId, Instant startDate, Instant endDate) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);

        Course course = courseRepository.findByIdAndTeacher_Id(courseId, teacherProfile.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COURSE_NOT_FOUND,
                        "Course was not found or does not belong to you",
                        HttpStatus.NOT_FOUND
                ));

        Instant effectiveEndDate = endDate != null ? endDate : Instant.now();
        Instant effectiveStartDate = startDate != null ? startDate : effectiveEndDate.minus(30, ChronoUnit.DAYS);

        if (effectiveStartDate.isAfter(effectiveEndDate)) {
            throw new BusinessException(MessageCodes.VALIDATION_FAILED, "Start date must be before or equal to end date", HttpStatus.BAD_REQUEST);
        }

        Instant maxAllowedEnd = Instant.now().plus(1, ChronoUnit.HOURS); // Buffer for timezone/clock sync
        if (effectiveEndDate.isAfter(maxAllowedEnd)) {
            throw new BusinessException(MessageCodes.VALIDATION_FAILED, "End date cannot be in the future", HttpStatus.BAD_REQUEST);
        }

        if (effectiveStartDate.plus(366, ChronoUnit.DAYS).isBefore(effectiveEndDate)) {
            throw new BusinessException(MessageCodes.VALIDATION_FAILED, "Date range cannot exceed 366 days", HttpStatus.BAD_REQUEST);
        }

        long totalEnrollment = enrollmentRepository.countByCourseIdAndDateRange(courseId, effectiveStartDate, effectiveEndDate);
        long completedStudents = enrollmentRepository.countByCourseIdAndStatusAndDateRange(courseId, EnrollmentStatus.COMPLETED, effectiveStartDate, effectiveEndDate);
        long refundedStudents = enrollmentRepository.countByCourseIdAndStatusAndDateRange(courseId, EnrollmentStatus.REFUNDED, effectiveStartDate, effectiveEndDate);
        long revokedStudents = enrollmentRepository.countByCourseIdAndStatusAndDateRange(courseId, EnrollmentStatus.REVOKED, effectiveStartDate, effectiveEndDate);
        long activeLearners = enrollmentRepository.countByCourseIdAndStatusAndDateRange(courseId, EnrollmentStatus.ACTIVE, effectiveStartDate, effectiveEndDate);

        long validEnrollmentForCompletion = totalEnrollment - refundedStudents - revokedStudents;
        double completionRate = validEnrollmentForCompletion > 0 ? (double) completedStudents / validEnrollmentForCompletion * 100 : 0.0;
        double refundRate = totalEnrollment > 0 ? (double) refundedStudents / totalEnrollment * 100 : 0.0;

        BigDecimal grossRevenue = escrowLedgerRepository.sumGrossRevenueByCourseIdAndDateRange(courseId, effectiveStartDate, effectiveEndDate);
        BigDecimal netRevenue = escrowLedgerRepository.sumNetRevenueByCourseIdAndDateRange(courseId, effectiveStartDate, effectiveEndDate);

        CourseReviewAggregateResponse reviewAggregate = courseReviewService.getAggregate(courseId);

        return TeacherCourseAnalyticsResponse.builder()
                .totalEnrollment(totalEnrollment)
                .activeLearners(activeLearners)
                .completedLearners(completedStudents)
                .completionRate(completionRate)
                .grossRevenue(grossRevenue != null ? grossRevenue : BigDecimal.ZERO)
                .netRevenue(netRevenue != null ? netRevenue : BigDecimal.ZERO)
                .refundRate(refundRate)
                .averageRating(reviewAggregate.averageRating())
                .totalReviews(reviewAggregate.reviewCount())
                .build();
    }

    @Override
    public CourseDraftResponse updateDraft(UUID draftId, CreateCourseDraftRequest request) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);
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
        course.setAccessDurationDays(normalizeAccessDuration(request.accessDurationDays()));
        course.setAccessExpiresAt(request.accessExpiresAt());
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
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);
        Course course = resolveDraftForTeacher(draftId, teacherProfile.getId());

        courseRepository.delete(course);
    }

    @Override
    public void submitForReview(UUID draftId) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolveTeacherWorkspace(currentUserId);
        Course course = resolveDraftForTeacher(draftId, teacherProfile.getId());
        CourseStatus previousStatus = course.getStatus();

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

        notificationService.createNotificationForAdminRole(
                "COURSE_MANAGER",
                "Khóa học mới đang chờ xét duyệt",
                "Giảng viên đã gửi khóa học \"" + course.getTitle() + "\" để xét duyệt.",
                NotificationTypes.COURSE_REVIEW,
                "/admin/courses/approvals/" + course.getId()
        );

        auditLogService.logUserAction(
                currentUserId,
                "TEACHER",
                "SUBMIT_COURSE",
                "COURSE",
                course.getId(),
                Map.of("status", previousStatus.name()),
                Map.of("status", CourseStatus.PENDING.name()),
                Map.of("courseTitle", course.getTitle())
        );
    }

    @Override
    public void publishCourse(UUID courseId) {
        UUID currentUserId = currentUserService.getCurrentUserId();
        TeacherProfile teacherProfile = resolvePublishEligibleTeacher(currentUserId);
        Course course = courseRepository.findByIdAndTeacher_Id(courseId, teacherProfile.getId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COURSE_NOT_FOUND,
                        "Course was not found",
                        HttpStatus.NOT_FOUND
                ));

        if (course.getStatus() != CourseStatus.APPROVED) {
            throw new BusinessException(
                    MessageCodes.MSG_COURSE_007,
                    "Only an approved course can be published.",
                    HttpStatus.CONFLICT
            );
        }

        ValidationResultResponse validationResult = courseValidationService.validateCourse(courseId);
        if (!validationResult.isValid()) {
            throw new com.manabihub.common.exception.ValidationBusinessException(
                    MessageCodes.MSG_COURSE_004,
                    "Course validation is no longer current. Please resolve the validation errors before publishing.",
                    validationResult.errors()
            );
        }

        Instant publishedAt = Instant.now();
        course.setStatus(CourseStatus.PUBLISHED);
        course.setPublishedAt(publishedAt);
        courseRepository.saveAndFlush(course);

        auditLogService.logUserAction(
                currentUserId,
                "TEACHER",
                "PUBLISH_COURSE",
                "COURSE",
                course.getId(),
                Map.of("status", CourseStatus.APPROVED.name()),
                Map.of(
                        "status", CourseStatus.PUBLISHED.name(),
                        "publishedAt", publishedAt.toString()
                ),
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
        CourseReviewAggregateResponse reviewAggregate =
                courseReviewService.getAggregate(course.getId());

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
                .aiSupported(course.isAiSupported())
                .accessDurationDays(course.getAccessDurationDays())
                .accessExpiresAt(course.getAccessExpiresAt())
                .teacher(PublicCourseDetailResponse.TeacherDto.builder()
                        .id(course.getTeacher().getId())
                        .name(course.getTeacher().getDisplayName())
                        .avatarUrl(course.getTeacher().getUser() != null ? course.getTeacher().getUser().getAvatarUrl() : null)
                        .bio(course.getTeacher().getBio())
                        .verified(course.getTeacher().getKycStatus() == TeacherKycStatus.APPROVED
                                && course.getTeacher().isCanPublishCourse()
                                && course.getTeacher().getUser() != null
                                && course.getTeacher().getUser().getUserStatus() == UserStatus.ACTIVE)
                        .build())
                .isEnrolled(isEnrolled)
                .isTeacherOwner(isAuthor)
                .totalDurationMinutes(totalDurationMinutes)
                .totalLessons(totalLessons)
                .averageRating(reviewAggregate.averageRating())
                .reviewCount(reviewAggregate.reviewCount())
                .modules(moduleResponses)
                .build();
    }

    private PublicModuleResponse mapModuleToPublicResponse(CourseModule module) {
        return PublicModuleResponse.builder()
                .id(module.getId())
                .title(module.getTitle())
                .orderIndex(module.getOrderIndex())
                .blocks(module.getBlocks().stream()
                        .filter(block -> !block.isModerationHidden())
                        .map(this::mapBlockToPublicResponse)
                        .toList())
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

    private TeacherProfile resolveTeacherWorkspace(UUID userId) {
        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_KYC_010,
                        "Complete identity and JLPT submission before using the teacher workspace",
                        HttpStatus.FORBIDDEN
                ));

        if (teacherProfile.getKycStatus() != TeacherKycStatus.PENDING
                && teacherProfile.getKycStatus() != TeacherKycStatus.APPROVED) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_010,
                    "Complete identity and JLPT submission before using the teacher workspace",
                    HttpStatus.FORBIDDEN
            );
        }

        return teacherProfile;
    }

    private TeacherProfile resolvePublishEligibleTeacher(UUID userId) {
        TeacherProfile teacherProfile = resolveTeacherWorkspace(userId);
        if (teacherProfile.getKycStatus() != TeacherKycStatus.APPROVED
                || !teacherProfile.isCanPublishCourse()) {
            throw new BusinessException(
                    MessageCodes.MSG_KYC_010,
                    "JLPT authenticity review must be approved before a course can appear on the platform",
                    HttpStatus.FORBIDDEN
            );
        }
        return teacherProfile;
    }

    private void validateDraftRequest(CreateCourseDraftRequest request, List<String> learningGoals) {
        int minimumLearningGoals = settingValueService.getInteger(
                "COURSE_MIN_LEARNING_GOALS",
                DEFAULT_MIN_LEARNING_GOALS
        );
        int maximumLearningGoalLength = settingValueService.getInteger(
                "COURSE_MAX_LEARNING_GOAL_LENGTH",
                DEFAULT_MAX_LEARNING_GOAL_LENGTH
        );
        BigDecimal coursePriceFloor = settingValueService.getDecimal(
                "COURSE_PRICE_FLOOR",
                BigDecimal.ZERO
        );

        if (request.accessDurationDays() != null && request.accessDurationDays() < 1) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST,
                    "Access duration must be at least one day");
        }
        if (request.accessExpiresAt() != null && request.accessExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST,
                    "Fixed access expiry must be in the future");
        }

        if (!StringUtils.hasText(request.category())
                || !courseCategoryRepository.existsByCodeAndActiveTrue(request.category().trim())) {
            throw new BusinessException(MessageCodes.MSG_COURSE_004, "Course category is invalid");
        }

        if (request.price() == null || request.price().compareTo(coursePriceFloor) < 0) {
            throw new BusinessException(
                    MessageCodes.MSG_COURSE_003,
                    "Course price must be at least " + coursePriceFloor.toPlainString()
            );
        }

        if (!StringUtils.hasText(request.prerequisites())) {
            throw new BusinessException(MessageCodes.MSG_GOAL_003, "Prerequisites are required");
        }

        if (!StringUtils.hasText(request.targetStudents())) {
            throw new BusinessException(MessageCodes.MSG_GOAL_004, "Target students are required");
        }

        if (learningGoals.size() < minimumLearningGoals) {
            throw new BusinessException(
                    MessageCodes.MSG_GOAL_001,
                    "At least " + minimumLearningGoals + " learning goals are required"
            );
        }

        boolean hasTooLongGoal = learningGoals.stream()
                .anyMatch(goal -> goal.length() > maximumLearningGoalLength);
        if (hasTooLongGoal) {
            throw new BusinessException(
                    MessageCodes.MSG_GOAL_002,
                    "Each learning goal must be at most "
                            + maximumLearningGoalLength
                            + " characters"
            );
        }
    }

    private int normalizeAccessDuration(Integer requestedDays) {
        return requestedDays == null ? 180 : requestedDays;
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
        return courseRepository.findByIdAndTeacher_IdAndStatusIn(
                        draftId,
                        teacherId,
                        List.of(CourseStatus.DRAFT, CourseStatus.REJECTED, CourseStatus.FORCED_DRAFT)
                )
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
                course.getAccessDurationDays(),
                course.getAccessExpiresAt(),
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

    @Override
    @Transactional(readOnly = true)
    public Page<PublicCourseSummaryResponse> searchPublicCourses(
            String keyword,
            String category,
            com.manabihub.course.enums.JlptLevel jlptLevel,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    ) {
        var spec = PublicCourseSpecification.buildSearch(keyword, category, jlptLevel, minPrice, maxPrice);
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);
        Map<UUID, CourseReviewAggregateResponse> reviewAggregates =
                courseReviewService.getAggregates(
                        coursePage.getContent().stream()
                                .map(Course::getId)
                                .toList()
                );

        return coursePage.map(course -> toSummaryResponse(
                course,
                reviewAggregates.getOrDefault(
                        course.getId(),
                        CourseReviewAggregateResponse.empty()
                )
        ));
    }

    private PublicCourseSummaryResponse toSummaryResponse(
            Course course,
            CourseReviewAggregateResponse reviewAggregate
    ) {
        int totalLessons = 0;
        for (CourseModule module : course.getModules()) {
            totalLessons += Math.toIntExact(module.getBlocks().stream()
                    .filter(block -> !block.isModerationHidden())
                    .count());
        }

        String teacherName = null;
        String teacherAvatarUrl = null;
        if (course.getTeacher() != null) {
            teacherName = course.getTeacher().getDisplayName();
            if (course.getTeacher().getUser() != null) {
                teacherAvatarUrl = course.getTeacher().getUser().getAvatarUrl();
            }
        }

        return PublicCourseSummaryResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .thumbnailUrl(course.getThumbnailUrl())
                .jlptLevel(course.getJlptLevel())
                .category(course.getCategory())
                .price(course.getPrice())
                .currency(course.getCurrency())
                .teacherId(course.getTeacher() != null ? course.getTeacher().getId() : null)
                .teacherName(teacherName)
                .teacherAvatarUrl(teacherAvatarUrl)
                .totalLessons(totalLessons)
                .publishedAt(course.getPublishedAt())
                .averageRating(reviewAggregate.averageRating())
                .reviewCount(reviewAggregate.reviewCount())
                .build();
    }

}
