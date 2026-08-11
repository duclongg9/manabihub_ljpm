package com.manabihub.challenge.repository;

import com.manabihub.challenge.entity.WeeklyLearningChallengePair;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface WeeklyLearningChallengePairRepository extends JpaRepository<WeeklyLearningChallengePair, UUID> {
    List<WeeklyLearningChallengePair> findByChallengeIdOrderByOrderIndex(UUID challengeId);
    long countByChallengeId(UUID challengeId);
    void deleteByChallengeId(UUID challengeId);
}
