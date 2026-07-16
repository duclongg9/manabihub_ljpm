package com.manabihub.learning.service;

import com.manabihub.learning.dto.request.FinalTestSubmitRequest;
import com.manabihub.learning.dto.response.FinalTestEligibilityResponse;
import com.manabihub.learning.dto.response.FinalTestSubmitResponse;

import java.util.UUID;

public interface LearningFinalTestService {
    FinalTestEligibilityResponse checkEligibility(UUID courseId);
    UUID startFinalTestAttempt(UUID courseId);
    FinalTestSubmitResponse submitFinalTest(UUID courseId, FinalTestSubmitRequest request);
    boolean isEligibleForCertificate(UUID courseId);
}
