package com.manabihub.course.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;
import com.manabihub.course.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/teacher/courses")
public class TeacherCourseController {

    private final CourseService courseService;

    @PostMapping("/drafts")
    public ResponseEntity<ApiResponse<CourseDraftResponse>> createDraft(
            @Valid @RequestBody CreateCourseDraftRequest request
    ) {
        CourseDraftResponse response = courseService.createDraft(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                MessageCodes.MSG_COURSE_001,
                "Course draft saved.",
                response
        ));
    }
}
