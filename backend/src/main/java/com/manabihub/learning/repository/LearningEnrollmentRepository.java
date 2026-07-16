package com.manabihub.learning.repository;

import com.manabihub.learning.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningEnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    @Query(value = "SELECT e.id FROM enrollments e JOIN student_profiles sp ON e.student_id = sp.id WHERE e.course_id = :courseId AND sp.user_id = :userId AND e.enrollment_status = 'ACTIVE'", nativeQuery = true)
    Optional<UUID> findActiveEnrollmentId(@Param("userId") UUID userId, @Param("courseId") UUID courseId);

    @Query(value = "SELECT COUNT(l.id) FROM lessons l JOIN course_modules m ON l.module_id = m.id WHERE m.course_id = :courseId", nativeQuery = true)
    int countTotalLessons(@Param("courseId") UUID courseId);

    @Query(value = "SELECT COUNT(lp.id) FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN course_modules m ON l.module_id = m.id WHERE m.course_id = :courseId AND lp.enrollment_id = :enrollmentId AND lp.status = 'COMPLETED'", nativeQuery = true)
    int countCompletedLessons(@Param("courseId") UUID courseId, @Param("enrollmentId") UUID enrollmentId);
}
