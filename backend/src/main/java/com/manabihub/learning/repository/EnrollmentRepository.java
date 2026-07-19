package com.manabihub.learning.repository;

import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    int countByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);

    @EntityGraph(attributePaths = {"course", "course.teacher", "course.teacher.user"})
    Page<Enrollment> findByStudentIdAndStatusIn(
            UUID studentId,
            List<EnrollmentStatus> statuses,
            Pageable pageable);

    Optional<Enrollment> findByStudent_User_IdAndCourse_IdAndStatus(
            UUID userId,
            UUID courseId,
            EnrollmentStatus status
    );
}
