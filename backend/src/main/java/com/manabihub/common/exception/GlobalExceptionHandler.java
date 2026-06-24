package com.manabihub.common.exception;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Centralized exception handler that guarantees all API responses follow
 * the {@link ApiResponse} envelope format.
 * <p>
 * Handler ordering (most specific first):
 * <ol>
 *   <li>{@link BusinessException} — domain/business-rule violations</li>
 *   <li>{@link MethodArgumentNotValidException} — @Valid / @Validated failures</li>
 *   <li>{@link ConstraintViolationException} — Jakarta Bean Validation on path/query params</li>
 *   <li>{@link AccessDeniedException} — Spring Security 403</li>
 *   <li>{@link AuthenticationException} — Spring Security 401</li>
 *   <li>{@link Exception} — catch-all for unexpected errors</li>
 * </ol>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ──────────────────────────────────────────────
    // Business errors
    // ──────────────────────────────────────────────

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(
            BusinessException ex, HttpServletRequest request) {

        log.warn("Business rule violation: [{}] - {}", ex.getMessageCode(), ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(
                ex.getMessageCode(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(ex.getHttpStatus()).body(response);
    }

    // ──────────────────────────────────────────────
    // Validation errors
    // ──────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        log.warn("Validation error on request to {}", request.getRequestURI());

        List<ErrorResponse> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> ErrorResponse.builder()
                        .field(fieldError.getField())
                        .messageCode(fieldError.getCode())
                        .message(fieldError.getDefaultMessage())
                        .rejectedValue(fieldError.getRejectedValue())
                        .build())
                .collect(Collectors.toList());

        // Also capture global (object-level) errors
        ex.getBindingResult().getGlobalErrors().forEach(globalError ->
                fieldErrors.add(ErrorResponse.builder()
                        .messageCode(globalError.getCode())
                        .message(globalError.getDefaultMessage())
                        .build()));

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.VALIDATION_FAILED,
                "Input validation failed",
                fieldErrors,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        log.warn("Constraint violation on request to {}", request.getRequestURI());

        List<ErrorResponse> errors = ex.getConstraintViolations().stream()
                .map(violation -> ErrorResponse.builder()
                        .field(violation.getPropertyPath().toString())
                        .messageCode("ConstraintViolation")
                        .message(violation.getMessage())
                        .rejectedValue(violation.getInvalidValue())
                        .build())
                .collect(Collectors.toList());

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.VALIDATION_FAILED,
                "Constraint validation failed",
                errors,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {

        log.warn("Missing request parameter: {}", ex.getParameterName());

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.COMMON_BAD_REQUEST,
                "Missing required parameter: " + ex.getParameterName(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        log.warn("Type mismatch for parameter '{}': {}", ex.getName(), ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.COMMON_BAD_REQUEST,
                "Invalid value for parameter: " + ex.getName(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // ──────────────────────────────────────────────
    // Security errors
    // ──────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        log.warn("Access denied for request to {}", request.getRequestURI());

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.AUTH_FORBIDDEN,
                "You do not have permission to access this resource",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        log.warn("Authentication failed for request to {}: {}", request.getRequestURI(), ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.AUTH_UNAUTHORIZED,
                "Authentication is required to access this resource",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // ──────────────────────────────────────────────
    // Resource not found
    // ──────────────────────────────────────────────

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(
            NoResourceFoundException ex, HttpServletRequest request) {

        log.warn("No resource found: {}", request.getRequestURI());

        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.COMMON_NOT_FOUND,
                "The requested resource was not found",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ──────────────────────────────────────────────
    // Catch-all for unexpected errors
    // ──────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(
            Exception ex, HttpServletRequest request) {

        log.error("Unhandled exception on request to {}: ", request.getRequestURI(), ex);

        // Never expose stack traces or internal details to the client
        ApiResponse<Void> response = ApiResponse.error(
                MessageCodes.COMMON_INTERNAL_ERROR,
                "An unexpected error occurred. Please contact the administrator.",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
