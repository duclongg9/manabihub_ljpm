package com.manabihub.course.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.course.dto.response.PublicCourseDetailResponse;
import com.manabihub.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;

    @GetMapping("/{identifier}")
    public ApiResponse<PublicCourseDetailResponse> getCourseDetail(@PathVariable String identifier) {
        PublicCourseDetailResponse data = courseService.getPublicCourseDetail(identifier);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", data);
    }
}
