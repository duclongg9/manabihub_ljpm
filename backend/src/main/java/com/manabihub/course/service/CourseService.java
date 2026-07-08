package com.manabihub.course.service;

import com.manabihub.course.dto.request.CreateCourseDraftRequest;
import com.manabihub.course.dto.response.CourseDraftResponse;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    CourseDraftResponse createDraft(CreateCourseDraftRequest request);

    List<CourseDraftResponse> listMyDrafts();

    CourseDraftResponse updateDraft(UUID draftId, CreateCourseDraftRequest request);

    void deleteDraft(UUID draftId);
}
