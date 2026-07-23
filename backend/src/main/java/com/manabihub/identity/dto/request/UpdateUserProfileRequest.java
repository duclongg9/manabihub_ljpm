package com.manabihub.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserProfileRequest {

    @NotBlank(message = "Full name must not be blank")
    @Size(max = 255)
    private String fullName;

    @Pattern(
            regexp = "^(0\\d{9}|\\+84\\d{9})$",
            message = "MSG-PRO-002"
    )
    private String phoneNumber;

}
