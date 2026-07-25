package com.manabihub.course.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.course.dto.response.ValidationResultResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.JlptLevel;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.finaltest.repository.FinalTestRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseValidationServiceImplTest {

    private static final String THUMBNAIL_URL_ERROR_CODE = "MSG-COURSE-021";

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private FinalTestRepository finalTestRepository;

    private CourseValidationServiceImpl courseValidationService;
    private UUID courseId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        courseValidationService = new CourseValidationServiceImpl(
                courseRepository,
                objectMapper,
                currentUserService,
                finalTestRepository);
        courseId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void validateCourse_WhenThumbnailUsesUploadedAssetPath_ShouldAcceptThumbnailUrl() {
        ValidationResultResponse result = validate(
                "/uploads/course-thumbnails/course-thumbnail-1234.png");

        assertFalse(hasThumbnailUrlError(result));
    }

    @Test
    void validateCourse_WhenThumbnailUsesExternalHttpsUrl_ShouldAcceptThumbnailUrl() {
        ValidationResultResponse result = validate(
                "https://cdn.example.com/course-thumbnail.png");

        assertFalse(hasThumbnailUrlError(result));
    }

    @Test
    void validateCourse_WhenThumbnailUsesUnknownRelativePath_ShouldRejectThumbnailUrl() {
        ValidationResultResponse result = validate("/images/course-thumbnail.png");

        assertTrue(hasThumbnailUrlError(result));
    }

    private ValidationResultResponse validate(String thumbnailUrl) {
        AppUser user = new AppUser();
        user.setId(userId);

        TeacherProfile teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setUser(user);

        Course course = Course.builder()
                .id(courseId)
                .teacher(teacher)
                .title("JLPT N5 Foundation")
                .introduction("Introductory Japanese course for new learners.")
                .jlptLevel(JlptLevel.N5)
                .category("GRAMMAR")
                .thumbnailUrl(thumbnailUrl)
                .outcomes("Understand basic N5 grammar and vocabulary.")
                .price(BigDecimal.valueOf(250_000))
                .prerequisites("No prerequisites")
                .targetStudents("Students starting Japanese from zero")
                .build();

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(finalTestRepository.findByCourseId(courseId)).thenReturn(Optional.empty());

        return courseValidationService.validateCourse(courseId);
    }

    private boolean hasThumbnailUrlError(ValidationResultResponse result) {
        return result.errors().stream()
                .anyMatch(error -> THUMBNAIL_URL_ERROR_CODE.equals(error.code()));
    }
}
