package com.manabihub.writing.repository;

import com.manabihub.writing.entity.WritingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WritingSubmissionRepository
        extends JpaRepository<WritingSubmission, UUID> {

    /**
     * Lấy bài nộp theo id và sinh viên.
     */
    Optional<WritingSubmission> findByIdAndStudent_Id(
            UUID id,
            UUID studentId);

    /**
     * Lấy bài nộp của sinh viên trong một Writing Block.
     */
    Optional<WritingSubmission> findByLessonBlock_IdAndStudent_Id(
            UUID lessonBlockId,
            UUID studentId);

    /**
     * Lấy toàn bộ bài nộp của sinh viên.
     */
    List<WritingSubmission> findByStudent_IdOrderBySubmittedAtDesc(
            UUID studentId);

    /**
     * Lấy tất cả bài nộp của một Writing Block.
     */
    List<WritingSubmission> findByLessonBlock_IdOrderBySubmittedAtDesc(
            UUID lessonBlockId);

    /**
     * Kiểm tra sinh viên đã nộp bài hay chưa.
     */
    boolean existsByLessonBlock_IdAndStudent_Id(
            UUID lessonBlockId,
            UUID studentId);
}