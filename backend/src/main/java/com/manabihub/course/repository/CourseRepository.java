package com.manabihub.course.repository;

import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    List<Course> findByTeacher_IdAndStatusOrderByCreatedAtDesc(UUID teacherId, CourseStatus status);

    Optional<Course> findByIdAndTeacher_IdAndStatus(UUID id, UUID teacherId, CourseStatus status);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(e.id) > 0 THEN true ELSE false END FROM enrollments e JOIN student_profiles sp ON e.student_id = sp.id WHERE e.course_id = :courseId AND sp.user_id = :userId AND e.enrollment_status = 'ACTIVE'", nativeQuery = true)
    boolean checkEnrollmentExists(@org.springframework.data.repository.query.Param("courseId") UUID courseId, @org.springframework.data.repository.query.Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"teacher.user", "modules"})
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdWithDetails(@org.springframework.data.repository.query.Param("id") UUID id);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"teacher.user", "modules"})
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Course c WHERE c.slug = :slug")
    Optional<Course> findBySlugWithDetails(@org.springframework.data.repository.query.Param("slug") String slug);
}
