package com.manabihub.violation.dto;

import com.manabihub.violation.enums.ViolationTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ViolationReportRequest {
    @NotNull(message = "Target type is required")
    private ViolationTargetType targetType;

    @NotNull(message = "Target ID is required")
    private UUID targetId;

    @NotBlank(message = "Reason is required")
    private String reason;
}
