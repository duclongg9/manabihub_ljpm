package com.manabihub.learning.repository;

import com.manabihub.course.entity.LessonBlock;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.entity.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, UUID> {

    List<FlashcardProgress> findByEnrollmentAndLessonBlock(
            Enrollment enrollment,
            LessonBlock lessonBlock
    );

    Optional<FlashcardProgress> findByEnrollmentAndLessonBlockAndCardIndex(
            Enrollment enrollment,
            LessonBlock lessonBlock,
            Integer cardIndex
    );

}