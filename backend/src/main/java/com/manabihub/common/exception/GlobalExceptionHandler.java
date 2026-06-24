package com.manabihub.common.exception;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        log.warn("Business rule violation: [{}] - {}", ex.getMessageCode(), ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error(ex.getMessageCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        log.warn("Validation error occurred during request parsing");
        List<ErrorResponse> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> ErrorResponse.builder()
                        .field(fieldError.getField())
                        .messageCode(fieldError.getCode())
                        .message(fieldError.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());

        ApiResponse<Void> response = ApiResponse.error(
                "VALIDATION_ERROR",
                "Input validation failed",
                errors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception occurred: ", ex);
        ApiResponse<Void> response = ApiResponse.error(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please contact the administrator."
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
