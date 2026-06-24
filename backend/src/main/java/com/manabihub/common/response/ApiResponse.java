package com.manabihub.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String messageCode;
    private String message;
    private T data;
    private List<ErrorResponse> errors;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .messageCode("SUCCESS")
                .message("Operation completed successfully")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String messageCode, String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .messageCode(messageCode)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(String messageCode, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .messageCode(messageCode)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> error(String messageCode, String message, List<ErrorResponse> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .messageCode(messageCode)
                .message(message)
                .errors(errors)
                .build();
    }
}
