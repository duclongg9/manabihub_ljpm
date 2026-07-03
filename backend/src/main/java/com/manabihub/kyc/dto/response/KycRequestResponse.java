package com.manabihub.kyc.dto.response;

import com.manabihub.kyc.enums.KycStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycRequestResponse {
    private UUID id;
    private UUID teacherId;
    private String teacherEmail;
    private String teacherFullName;
    private KycStatus status;
    private String displayName;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String certificateUrl;
    private String selfieUrl;
    private Boolean copyrightAccepted;
    private String vnptVerificationStatus;
    private String vnptResponseDetails;
    private String riskLevel;
    private String decisionNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String processedByEmail;
    private LocalDateTime processedAt;
}
