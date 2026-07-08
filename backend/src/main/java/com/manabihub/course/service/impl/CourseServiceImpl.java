package com.manabihub.course.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseLearningGoal;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.CourseService;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
