package com.manabihub.identity.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStudentProfileRequest
        extends UpdateUserProfileRequest {

    @Size(max = 255)
    private String displayName;

    @Size(max = 20)
    private String jlptGoal;
}