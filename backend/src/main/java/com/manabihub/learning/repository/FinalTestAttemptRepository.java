package com.manabihub.learning.repository;

import com.manabihub.learning.entity.FinalTestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FinalTestAttemptRepository extends JpaRepository<FinalTestAttempt, UUID> {
    List<FinalTestAttempt> findByEnrollmentIdAndFinalTestId(UUID enrollmentId, UUID finalTestId);
    boolean existsByEnrollmentIdAndPassedTrue(UUID enrollmentId);
}
