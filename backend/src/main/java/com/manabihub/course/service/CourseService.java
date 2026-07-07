package com.manabihub.course.service;

import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;

public interface CourseService {

    CourseDraftResponse createDraft(CreateCourseDraftRequest request);
}
