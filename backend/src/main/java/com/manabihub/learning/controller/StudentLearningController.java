package com.manabihub.learning.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.learning.dto.request.SaveVideoProgressRequest;
import com.manabihub.learning.dto.response.CourseLearningResponse;
import com.manabihub.learning.dto.response.CourseProgressSummaryResponse;
import com.manabihub.learning.dto.response.LessonProgressResponse;
import com.manabihub.learning.dto.response.MyCourseResponse;
import com.manabihub.learning.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/student")
public class StudentLearningController {

    private final LearningService learningService;

    @GetMapping("/my-courses")
    public ResponseEntity<ApiResponse<List<MyCourseResponse>>> listMyCourses() {
        List<MyCourseResponse> response = learningService.listMyCourses();

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "My learning courses loaded.",
                response
        ));
    }

    @GetMapping("/courses/{courseId}/learn")
    public ResponseEntity<ApiResponse<CourseLearningResponse>> openOrResumeCourse(@PathVariable UUID courseId) {
        CourseLearningResponse response = learningService.openOrResumeCourse(courseId);

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Course learning content loaded.",
                response
        ));
    }

    @PutMapping("/lessons/{lessonBlockId}/video-progress")
    public ResponseEntity<ApiResponse<LessonProgressResponse>> saveVideoProgress(
            @PathVariable UUID lessonBlockId,
            @Valid @RequestBody SaveVideoProgressRequest request
    ) {
        LessonProgressResponse response = learningService.saveVideoProgress(lessonBlockId, request);

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.LEARNING_PROGRESS_UPDATED,
                "Video progress saved.",
                response
        ));
    }

    @PostMapping("/lessons/{lessonBlockId}/complete")
    public ResponseEntity<ApiResponse<LessonProgressResponse>> markLessonComplete(@PathVariable UUID lessonBlockId) {
        LessonProgressResponse response = learningService.markLessonComplete(lessonBlockId);

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.LEARNING_LESSON_COMPLETED,
                "Lesson marked as completed.",
                response
        ));
    }

    @GetMapping("/courses/{courseId}/progress")
    public ResponseEntity<ApiResponse<CourseProgressSummaryResponse>> getCourseProgress(@PathVariable UUID courseId) {
        CourseProgressSummaryResponse response = learningService.getCourseProgress(courseId);

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Course progress loaded.",
                response
        ));
    }
}
