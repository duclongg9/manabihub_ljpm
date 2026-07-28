package com.manabihub.moderation.service;

import com.manabihub.moderation.dto.request.ResolveViolationRequest;
import com.manabihub.moderation.dto.response.ViolationDetailResponse;
import com.manabihub.moderation.dto.response.ViolationQueueItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ViolationModerationService {

    Page<ViolationQueueItemResponse> getViolationQueue(String status, Pageable pageable);

    ViolationDetailResponse getViolationDetail(UUID reportId);

    ViolationDetailResponse resolveViolation(UUID reportId, ResolveViolationRequest request, UUID adminId);
}
