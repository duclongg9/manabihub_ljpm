package com.manabihub.kyc.dto.request;

import com.manabihub.kyc.enums.KycStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycReviewRequest {

    @NotNull(message = "Decision status is required")
    private KycStatus status;

    private String decisionNote;
}
