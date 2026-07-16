package com.manabihub.learning.service.impl;

import com.manabihub.common.response.PageResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentLearningServiceImpl implements StudentLearningService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentDashboardStatsResponse getDashboardStats(UUID userId) {
        StudentProfile profile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found for user: " + userId));

        UUID studentId = profile.getId();
        int total = enrollmentRepository.countByStudentId(studentId);
        int active = enrollmentRepository.countByStudentIdAndStatus(studentId, EnrollmentStatus.ACTIVE);
        int completed = enrollmentRepository.countByStudentIdAndStatus(studentId, EnrollmentStatus.COMPLETED);

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
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found for user: " + userId));

        Page<Enrollment> enrollmentsPage = enrollmentRepository.findByStudentId(profile.getId(), pageable);

        List<StudentCourseSummaryResponse> content = enrollmentsPage.getContent().stream()
                .map(this::mapToSummaryResponse)
                .toList();

        return new PageResponse<>(
                content,
                enrollmentsPage.getNumber(),
                enrollmentsPage.getSize(),
                enrollmentsPage.getTotalElements(),
                enrollmentsPage.getTotalPages(),
                enrollmentsPage.isLast()
        );
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
                .progressPercentage(0) // Mocked for now until lesson progress is implemented
                .build();
    }
}
