package com.manabihub.learning.repository;

import com.manabihub.course.entity.LessonBlock;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.learning.entity.FlashcardReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardReviewRepository extends JpaRepository<FlashcardReview, UUID> {

    Optional<FlashcardReview> findByStudentAndLessonBlockAndCardIndex(
            StudentProfile student,
            LessonBlock lessonBlock,
            Integer cardIndex
    );

    List<FlashcardReview> findByStudentAndLessonBlockOrderByCardIndexAsc(
            StudentProfile student,
            LessonBlock lessonBlock
    );

    long countByStudentAndLessonBlock(
            StudentProfile student,
            LessonBlock lessonBlock
    );
}