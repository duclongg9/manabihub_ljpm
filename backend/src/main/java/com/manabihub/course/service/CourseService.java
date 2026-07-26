package com.manabihub.course.service;

import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;
import com.manabihub.course.dto.response.PublicCourseSummaryResponse;
import com.manabihub.course.enums.JlptLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CourseService {

    CourseDraftResponse createDraft(CreateCourseDraftRequest request);

    List<CourseDraftResponse> listMyDrafts();

    com.manabihub.course.dto.response.TeacherDashboardResponse getTeacherDashboardStats();

    CourseDraftResponse updateDraft(UUID draftId, CreateCourseDraftRequest request);

    void deleteDraft(UUID draftId);

    void submitForReview(UUID draftId);

    com.manabihub.course.dto.response.PublicCourseDetailResponse getPublicCourseDetail(String identifier);

    Page<PublicCourseSummaryResponse> searchPublicCourses(
            String keyword,
            String category,
            JlptLevel jlptLevel,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    );
}
