package com.manabihub.course.repository;

import com.manabihub.course.entity.LessonBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonBlockRepository extends JpaRepository<LessonBlock, UUID> {

    List<LessonBlock> findByModule_IdOrderByOrderIndexAsc(UUID moduleId);

    Optional<LessonBlock> findByIdAndModule_Id(UUID id, UUID moduleId);
}
