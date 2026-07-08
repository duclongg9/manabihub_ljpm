package com.manabihub.course.service;

import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;

import java.util.List;

public interface CourseService {

    CourseDraftResponse createDraft(CreateCourseDraftRequest request);

    List<CourseDraftResponse> listMyDrafts();
}
