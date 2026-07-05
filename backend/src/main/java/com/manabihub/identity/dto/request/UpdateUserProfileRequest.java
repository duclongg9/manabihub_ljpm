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
            regexp = "^(0|\\+84)[0-9]{9}$",
            message = "Invalid phone number"
    )
    @Size (max = 10, min = 10)
    private String phoneNumber;

    private String avatarUrl;

}