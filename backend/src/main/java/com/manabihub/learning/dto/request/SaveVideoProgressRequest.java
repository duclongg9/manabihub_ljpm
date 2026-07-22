package com.manabihub.learning.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaveVideoProgressRequest(
        @NotNull @Min(0) Integer positionSeconds
) {
}
