package com.manabihub.common.demo;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Demo-only controller for verifying the API response convention.
 * <p>
 * <b>DO NOT use in production.</b> This controller exists solely to validate
 * the response envelope, exception handling, and message code patterns
 * during Iteration 0 setup.
 * <p>
 * TODO: Remove or disable this controller before production release.
 */
@RestController
@RequestMapping("/api/v1/demo")
public class DemoController {

    /**
     * Demonstrates a successful response.
     */
    @GetMapping("/success")
    public ResponseEntity<ApiResponse<Map<String, String>>> demoSuccess() {
        Map<String, String> data = Map.of(
                "greeting", "Hello from ManabiHub!",
                "status", "API response convention is working"
        );
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Demonstrates a business exception response.
     */
    @GetMapping("/business-error")
    public ResponseEntity<ApiResponse<Void>> demoBusinessError() {
        throw new BusinessException(
                MessageCodes.COURSE_NOT_FOUND,
                "Course with the given ID was not found"
        );
    }

    /**
     * Demonstrates a business exception with a non-400 status.
     */
    @GetMapping("/not-found-error")
    public ResponseEntity<ApiResponse<Void>> demoNotFoundError() {
        throw new BusinessException(
                MessageCodes.COURSE_NOT_FOUND,
                "Course with the given ID was not found",
                HttpStatus.NOT_FOUND
        );
    }

    /**
     * Demonstrates a validation error response.
     */
    @PostMapping("/validation-error")
    public ResponseEntity<ApiResponse<Void>> demoValidationError(
            @Valid @RequestBody DemoRequest request) {
        // If validation passes, return success
        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.COMMON_SUCCESS,
                "Validation passed"
        ));
    }

    @Data
    static class DemoRequest {
        @NotBlank(message = "Name must not be blank")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email must not be blank")
        private String email;
    }
}
