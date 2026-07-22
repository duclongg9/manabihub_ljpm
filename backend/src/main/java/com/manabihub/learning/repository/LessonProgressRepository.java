package com.manabihub.learning.repository;

import com.manabihub.learning.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, UUID> {

    Optional<LessonProgress> findByEnrollment_IdAndLessonBlock_Id(UUID enrollmentId, UUID lessonBlockId);

    List<LessonProgress> findByEnrollment_Id(UUID enrollmentId);
}
