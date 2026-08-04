package com.manabihub.violation.controller;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.violation.dto.ViolationReportRequest;
import com.manabihub.violation.dto.ViolationReportResponse;
import com.manabihub.violation.service.ViolationReportService;
import com.manabihub.common.constants.MessageCodes;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import com.manabihub.identity.service.CurrentUserService;

@RestController
@RequestMapping("/api/v1/violations")
@RequiredArgsConstructor
@Tag(name = "Violation Reports", description = "API for reporting course/content violations")
public class ViolationReportController {

    private final ViolationReportService violationReportService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER')")
    @Operation(summary = "Submit a violation report")
    public ApiResponse<ViolationReportResponse> submitReport(
            @Valid @RequestBody ViolationReportRequest request) {

        UUID reporterId = currentUserService.getCurrentUserId();
        ViolationReportResponse response = violationReportService.submitReport(request, reporterId);
        return ApiResponse.success(MessageCodes.MSG_REP_001, "Report submitted successfully", response);
    }
}
