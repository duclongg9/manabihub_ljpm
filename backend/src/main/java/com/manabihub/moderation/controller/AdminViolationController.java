package com.manabihub.moderation.controller;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.moderation.dto.request.ResolveViolationRequest;
import com.manabihub.moderation.dto.response.ViolationDetailResponse;
import com.manabihub.moderation.dto.response.ViolationQueueItemResponse;
import com.manabihub.moderation.service.ViolationModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/violations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('COURSE_MANAGER', 'SYSTEM_ADMIN')")
public class AdminViolationController {

    private final ViolationModerationService violationModerationService;

    @GetMapping
    public ApiResponse<Page<ViolationQueueItemResponse>> getViolationQueue(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ViolationQueueItemResponse> queue = violationModerationService.getViolationQueue(status, pageable);
        return ApiResponse.success(queue);
    }

    @GetMapping("/{id}")
    public ApiResponse<ViolationDetailResponse> getViolationDetail(@PathVariable UUID id) {
        ViolationDetailResponse detail = violationModerationService.getViolationDetail(id);
        return ApiResponse.success(detail);
    }

    @PostMapping("/{id}/resolve")
    public ApiResponse<ViolationDetailResponse> resolveViolation(
            @PathVariable UUID id,
            @RequestBody @Valid ResolveViolationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
            
        UUID adminId = UUID.fromString(jwt.getSubject());
        ViolationDetailResponse result = violationModerationService.resolveViolation(id, request, adminId);
        return ApiResponse.success("MSG-ADM-003", "Violation resolved successfully", result);
    }
}
