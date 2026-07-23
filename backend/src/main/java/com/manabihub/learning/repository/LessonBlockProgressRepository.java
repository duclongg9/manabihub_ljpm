package com.manabihub.learning.repository;

import com.manabihub.learning.entity.LessonBlockProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonBlockProgressRepository extends JpaRepository<LessonBlockProgress, UUID> {
    Optional<LessonBlockProgress> findByEnrollmentIdAndLessonBlockId(UUID enrollmentId, UUID lessonBlockId);
    List<LessonBlockProgress> findByEnrollmentId(UUID enrollmentId);
}
