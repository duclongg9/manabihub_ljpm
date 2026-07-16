package com.manabihub.learning.service;

import com.manabihub.learning.dto.request.QuizSubmitRequest;
import com.manabihub.learning.dto.response.QuizSubmitResponse;

import java.util.UUID;

public interface LearningQuizService {
    QuizSubmitResponse submitQuiz(UUID courseId, UUID blockId, QuizSubmitRequest request);
}
