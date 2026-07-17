package com.manabihub.ai.repository;

import com.manabihub.ai.entity.AiWritingSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiWritingSuggestionRepository extends JpaRepository<AiWritingSuggestion, UUID> {

    Optional<AiWritingSuggestion> findByWritingSubmission_Id(UUID writingSubmissionId);
}