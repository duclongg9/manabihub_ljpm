package com.manabihub.violation.service;

import com.manabihub.violation.dto.ViolationReportRequest;
import com.manabihub.violation.dto.ViolationReportResponse;
import java.util.UUID;

public interface ViolationReportService {
    ViolationReportResponse submitReport(ViolationReportRequest request, UUID reporterId);
}
