package com.manabihub.learning.repository;

import com.manabihub.learning.entity.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, UUID> {
    List<FlashcardProgress> findByEnrollmentId(UUID enrollmentId);

    List<FlashcardProgress> findByEnrollmentIdAndLessonBlockId(UUID enrollmentId, UUID lessonBlockId);

    Optional<FlashcardProgress> findByEnrollmentIdAndLessonBlockIdAndCardIndex(UUID enrollmentId, UUID lessonBlockId, int cardIndex);

    int countByEnrollmentIdAndLessonBlockId(UUID enrollmentId, UUID lessonBlockId);
}
