package com.manabihub.learning.service;

import com.manabihub.learning.dto.request.ReviewFlashcardRequest;
import com.manabihub.learning.dto.request.SaveVideoProgressRequest;
import com.manabihub.learning.dto.response.CourseLearningResponse;
import com.manabihub.learning.dto.response.CourseProgressSummaryResponse;
import com.manabihub.learning.dto.response.LessonProgressResponse;

import java.util.UUID;

public interface LearningService {

    CourseLearningResponse openOrResumeCourse(UUID courseId);

    LessonProgressResponse saveVideoProgress(UUID lessonBlockId, SaveVideoProgressRequest request);

    LessonProgressResponse reviewFlashcard(UUID lessonBlockId, ReviewFlashcardRequest request);

    LessonProgressResponse markLessonComplete(UUID lessonBlockId);

    CourseProgressSummaryResponse getCourseProgress(UUID courseId);
}
