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

        List<Course> findAllByStatusInOrderBySubmittedAtDesc(java.util.Collection<CourseStatus> statuses);

        @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM lesson_blocks lb " +
                        "JOIN lessons l ON lb.lesson_id = l.id " +
                        "JOIN course_modules cm ON l.module_id = cm.id " +
                        "WHERE cm.course_id = :courseId", nativeQuery = true)
        int countLessonBlocksByCourseId(@org.springframework.data.repository.query.Param("courseId") UUID courseId);

        @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(l.id) > 0 THEN true ELSE false END "
                        +
                        "FROM lessons l " +
                        "JOIN course_modules cm ON l.module_id = cm.id " +
                        "WHERE cm.course_id = :courseId AND l.lesson_type = 'QUIZ'", nativeQuery = true)
        boolean hasFinalTestByCourseId(@org.springframework.data.repository.query.Param("courseId") UUID courseId);

        @org.springframework.data.jpa.repository.Query(value = "SELECT EXISTS (" +
                        "SELECT 1 FROM internal_admin_accounts admin " +
                        "JOIN internal_admin_roles admin_role ON admin_role.admin_account_id = admin.id " +
                        "JOIN roles role ON role.id = admin_role.role_id " +
                        "WHERE admin.id = :adminId AND role.code IN (:roleCodes) AND admin.account_status = 'ACTIVE')", nativeQuery = true)
        boolean hasAdminRole(@org.springframework.data.repository.query.Param("adminId") UUID adminId,
                        @org.springframework.data.repository.query.Param("roleCodes") java.util.Collection<String> roleCodes);
}
