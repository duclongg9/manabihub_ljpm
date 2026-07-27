package com.manabihub.course.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.response.PublicTeacherCourseResponse;
import com.manabihub.course.dto.response.PublicTeacherProfileResponse;
import com.manabihub.course.dto.response.PublicTeacherSummaryResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.PublicTeacherProfileService;
import com.manabihub.kyc.domain.TeacherKycStatus;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicTeacherProfileServiceImpl implements PublicTeacherProfileService {

    private static final String PRIVATE_PROFILE_MESSAGE = "Teacher profile was not found";
    private static final String FALLBACK_DISPLAY_NAME = "Giảng viên ManabiHub";

    private final TeacherProfileRepository teacherProfileRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional(readOnly = true)
    public PublicTeacherProfileResponse getProfile(UUID teacherId) {
        TeacherProfile profile = findDiscoverableProfile(teacherId);
        List<PublicTeacherCourseResponse> courses = courseRepository
                .findByTeacher_IdAndStatusOrderByPublishedAtDesc(teacherId, CourseStatus.PUBLISHED)
                .stream()
                .map(this::toCourseResponse)
                .toList();

        return new PublicTeacherProfileResponse(
                profile.getId(),
                publicDisplayName(profile),
                profile.getUser().getAvatarUrl(),
                profile.getBio(),
                true,
                courses.size(),
                courses
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicTeacherSummaryResponse> listFeatured(int limit) {
        return teacherProfileRepository.findDiscoverableProfiles(
                        TeacherKycStatus.APPROVED,
                        UserStatus.ACTIVE,
                        PageRequest.of(0, limit)
                )
                .stream()
                .map(profile -> new PublicTeacherSummaryResponse(
                        profile.getId(),
                        publicDisplayName(profile),
                        profile.getUser().getAvatarUrl(),
                        profile.getBio(),
                        true,
                        courseRepository.countByTeacher_IdAndStatus(profile.getId(), CourseStatus.PUBLISHED)
                ))
                .toList();
    }

    private TeacherProfile findDiscoverableProfile(UUID teacherId) {
        return teacherProfileRepository
                .findByIdAndKycStatusAndCanPublishCourseTrueAndUser_UserStatus(
                        teacherId,
                        TeacherKycStatus.APPROVED,
                        UserStatus.ACTIVE
                )
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        PRIVATE_PROFILE_MESSAGE,
                        HttpStatus.NOT_FOUND
                ));
    }

    private String publicDisplayName(TeacherProfile profile) {
        return StringUtils.hasText(profile.getDisplayName())
                ? profile.getDisplayName().trim()
                : FALLBACK_DISPLAY_NAME;
    }

    private PublicTeacherCourseResponse toCourseResponse(Course course) {
        int totalLessons = course.getModules().stream()
                .mapToInt(module -> module.getBlocks().size())
                .sum();

        return new PublicTeacherCourseResponse(
                course.getId(),
                course.getTitle(),
                course.getSlug(),
                course.getThumbnailUrl(),
                course.getJlptLevel(),
                course.getCategory(),
                course.getPrice(),
                course.getCurrency(),
                totalLessons,
                course.getPublishedAt()
        );
    }
}
