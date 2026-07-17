package com.manabihub.learning.service;

import com.manabihub.learning.dto.request.SaveVideoProgressRequest;
import com.manabihub.learning.dto.response.CourseLearningResponse;
import com.manabihub.learning.dto.response.CourseProgressSummaryResponse;
import com.manabihub.learning.dto.response.LessonProgressResponse;
import com.manabihub.learning.dto.response.MyCourseResponse;

import java.util.List;
import java.util.UUID;

public interface LearningService {

    CourseLearningResponse openOrResumeCourse(UUID courseId);

    LessonProgressResponse saveVideoProgress(UUID lessonBlockId, SaveVideoProgressRequest request);

    LessonProgressResponse markLessonComplete(UUID lessonBlockId);

    CourseProgressSummaryResponse getCourseProgress(UUID courseId);

    List<MyCourseResponse> listMyCourses();
}
