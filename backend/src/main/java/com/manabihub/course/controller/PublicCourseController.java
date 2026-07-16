package com.manabihub.course.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.PageResponse;
import com.manabihub.course.dto.response.PublicCourseDetailResponse;
import com.manabihub.course.dto.response.PublicCourseSummaryResponse;
import com.manabihub.course.enums.JlptLevel;
import com.manabihub.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/public/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;

    @GetMapping
    public ApiResponse<PageResponse<PublicCourseSummaryResponse>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) JlptLevel jlptLevel,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "publishedAt,desc") String sort
    ) {
        Pageable pageable = buildPageable(page, Math.min(size, 50), sort);
        Page<PublicCourseSummaryResponse> result = courseService.searchPublicCourses(
                keyword, category, jlptLevel, minPrice, maxPrice, pageable
        );
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", PageResponse.from(result));
    }

    @GetMapping("/{identifier}")
    public ApiResponse<PublicCourseDetailResponse> getCourseDetail(@PathVariable String identifier) {
        PublicCourseDetailResponse data = courseService.getPublicCourseDetail(identifier);
        return ApiResponse.success(MessageCodes.COMMON_SUCCESS, "Success", data);
    }

    private Pageable buildPageable(int page, int size, String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // Only allow sorting by safe fields
        if (!isSortableField(property)) {
            property = "publishedAt";
            direction = Sort.Direction.DESC;
        }

        return PageRequest.of(page, size, Sort.by(direction, property));
    }

    private boolean isSortableField(String field) {
        return "publishedAt".equals(field)
                || "price".equals(field)
                || "title".equals(field)
                || "createdAt".equals(field);
    }
}
