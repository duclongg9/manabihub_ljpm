package com.manabihub.learning.repository;

import com.manabihub.learning.entity.CourseEnrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, UUID> {

    Optional<CourseEnrollment> findByStudent_IdAndCourse_Id(UUID studentId, UUID courseId);

    List<CourseEnrollment> findByStudent_IdOrderByEnrolledAtDesc(UUID studentId);
    Optional<CourseEnrollment> findByStudent_IdAndCourse_IdAndStatus(
            UUID studentId,
            UUID courseId,
            EnrollmentStatus status
    );
}
