package com.manabihub.learning.service.impl;

import com.manabihub.common.response.PageResponse;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.learning.dto.response.StudentCourseSummaryResponse;
import com.manabihub.learning.dto.response.StudentDashboardStatsResponse;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.service.StudentLearningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentLearningServiceImpl implements StudentLearningService {

    private static final List<EnrollmentStatus> LEARNING_STATUSES =
            List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED);

    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentDashboardStatsResponse getDashboardStats(UUID userId) {
        StudentProfile profile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found for user",
                        HttpStatus.NOT_FOUND));

        UUID studentId = profile.getId();
        int active = enrollmentRepository.countByStudentIdAndStatus(studentId, EnrollmentStatus.ACTIVE);
        int completed = enrollmentRepository.countByStudentIdAndStatus(studentId, EnrollmentStatus.COMPLETED);
        int total = active + completed;

        return StudentDashboardStatsResponse.builder()
                .totalEnrolledCourses(total)
                .activeCourses(active)
                .completedCourses(completed)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StudentCourseSummaryResponse> getEnrolledCourses(UUID userId, Pageable pageable) {
        StudentProfile profile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found for user",
                        HttpStatus.NOT_FOUND));

        Page<Enrollment> enrollmentsPage = enrollmentRepository.findByStudentIdAndStatusIn(
                profile.getId(),
                LEARNING_STATUSES,
                pageable);

        Page<StudentCourseSummaryResponse> responsePage = enrollmentsPage.map(this::mapToSummaryResponse);
        return PageResponse.from(responsePage);
    }

    private StudentCourseSummaryResponse mapToSummaryResponse(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        String teacherName = course.getTeacher() != null && course.getTeacher().getUser() != null
                ? course.getTeacher().getUser().getFullName()
                : null;

        return StudentCourseSummaryResponse.builder()
                .enrollmentId(enrollment.getId())
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .thumbnailUrl(course.getThumbnailUrl())
                .teacherName(teacherName)
                .enrollmentStatus(enrollment.getStatus())
                .enrolledAt(enrollment.getEnrolledAt())
                .build();
    }
}
