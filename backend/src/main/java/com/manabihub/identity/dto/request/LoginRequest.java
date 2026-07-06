package com.manabihub.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "MSG-COM-002") // Required field is empty
    @Email(message = "MSG-COM-002")    // Reusing the general empty/invalid message code per spec
    private String email;

    @NotBlank(message = "MSG-COM-002")
    private String password;
}
