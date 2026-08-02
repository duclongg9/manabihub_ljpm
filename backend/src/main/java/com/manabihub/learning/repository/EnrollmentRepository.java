package com.manabihub.learning.repository;

import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    int countByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);
    
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.status = :status")
    long countByCourse_IdAndStatus(@Param("courseId") UUID courseId, @Param("status") EnrollmentStatus status);

    @EntityGraph(attributePaths = {"course", "course.teacher", "course.teacher.user"})
    Page<Enrollment> findByStudentIdAndStatusIn(
            UUID studentId,
            List<EnrollmentStatus> statuses,
            Pageable pageable);

    // UC-10: study course lessons — resolve the current student's enrollment for a course.
    Optional<Enrollment> findByStudent_IdAndCourse_Id(UUID studentId, UUID courseId);

    /**
     * Serializes review upserts for the same enrollment. The database unique
     * constraint remains the final guarantee, while this lock makes concurrent
     * PUT requests deterministic at the service boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT enrollment
            FROM Enrollment enrollment
            JOIN FETCH enrollment.course
            WHERE enrollment.student.id = :studentId
              AND enrollment.course.id = :courseId
            """)
    Optional<Enrollment> findByStudentIdAndCourseIdForReview(
            @Param("studentId") UUID studentId,
            @Param("courseId") UUID courseId
    );
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Enrollment e WHERE e.id = :id")
    Optional<Enrollment> findByIdForUpdate(@Param("id") UUID id);
}
