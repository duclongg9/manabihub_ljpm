package com.manabihub.learning.repository;

import com.manabihub.learning.entity.LessonBlockProgress;
import com.manabihub.learning.enums.LessonProgressStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonBlockProgressRepository extends JpaRepository<LessonBlockProgress, UUID> {
    Optional<LessonBlockProgress> findByEnrollmentIdAndLessonBlockId(UUID enrollmentId, UUID lessonBlockId);
    List<LessonBlockProgress> findByEnrollmentId(UUID enrollmentId);

    @Query("""
            SELECT progress.enrollmentId AS enrollmentId, COUNT(progress) AS completedCount
            FROM LessonBlockProgress progress
            WHERE progress.enrollmentId IN :enrollmentIds
              AND progress.status = :status
            GROUP BY progress.enrollmentId
            """)
    List<CompletedProgressCount> countByEnrollmentIdsAndStatus(
            @Param("enrollmentIds") Collection<UUID> enrollmentIds,
            @Param("status") LessonProgressStatus status);

    interface CompletedProgressCount {
        UUID getEnrollmentId();
        long getCompletedCount();
    }
}
