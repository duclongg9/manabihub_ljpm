package com.manabihub.course.service;

import com.manabihub.course.dto.response.ValidationResultResponse;

import java.util.UUID;

public interface CourseValidationService {
    
    /**
     * Validates the course structure and content before it can be submitted for review.
     * @param courseId The UUID of the course draft.
     * @return ValidationResultResponse containing isValid flag and list of ValidationErrors.
     */
    ValidationResultResponse validateCourse(UUID courseId);
}
