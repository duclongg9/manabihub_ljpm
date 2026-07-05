package com.manabihub.kyc.dto.request;

import com.manabihub.kyc.domain.KycRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycReviewRequest {

    @NotNull(message = "Decision status is required")
    private KycRequestStatus status;

    private String decisionNote;
}
