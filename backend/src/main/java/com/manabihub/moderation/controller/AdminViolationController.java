package com.manabihub.moderation.controller;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.moderation.dto.request.ResolveViolationRequest;
import com.manabihub.moderation.dto.response.ViolationDetailResponse;
import com.manabihub.moderation.dto.response.ViolationQueueItemResponse;
import com.manabihub.moderation.service.ViolationModerationService;
import com.manabihub.moderation.enums.ViolationReportStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Admin Violation Moderation", description = "Permission-controlled UC-30 violation review and resolution")
public class AdminViolationController {

    private final ViolationModerationService violationModerationService;

    @GetMapping
    @Operation(summary = "List violation reports visible to moderation administrators")
    public ApiResponse<Page<ViolationQueueItemResponse>> getViolationQueue(
            @RequestParam(required = false) ViolationReportStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {

        Page<ViolationQueueItemResponse> queue = violationModerationService.getViolationQueue(
                status,
                pageable,
                UUID.fromString(jwt.getSubject())
        );
        return ApiResponse.success(queue);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get violation detail, evidence, history, warnings and allowed actions")
    public ApiResponse<ViolationDetailResponse> getViolationDetail(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        ViolationDetailResponse detail = violationModerationService.getViolationDetail(
                id,
                UUID.fromString(jwt.getSubject())
        );
        return ApiResponse.success(detail);
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Apply an atomic violation decision and its authorized enforcement actions")
    public ApiResponse<ViolationDetailResponse> resolveViolation(
            @PathVariable UUID id,
            @RequestBody @Valid ResolveViolationRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID adminId = UUID.fromString(jwt.getSubject());
        ViolationDetailResponse result = violationModerationService.resolveViolation(id, request, adminId);
        return ApiResponse.success("MSG-ADM-003", "Violation resolved successfully", result);
    }
}
