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
}
