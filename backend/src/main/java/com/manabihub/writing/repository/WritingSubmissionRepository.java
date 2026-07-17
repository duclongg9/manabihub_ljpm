package com.manabihub.writing.repository;

import com.manabihub.writing.entity.WritingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WritingSubmissionRepository extends JpaRepository<WritingSubmission, UUID> {

    Optional<WritingSubmission> findByIdAndStudent_Id(UUID id, UUID studentId);

    List<WritingSubmission> findByStudent_IdOrderBySubmittedAtDesc(UUID studentId);

    boolean existsByLessonBlock_IdAndStudent_Id(UUID lessonBlockId, UUID studentId);
}