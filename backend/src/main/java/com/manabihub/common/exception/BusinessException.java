package com.manabihub.common.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final String messageCode;
    private final String message;

    public BusinessException(String messageCode, String message) {
        super(message);
        this.messageCode = messageCode;
        this.message = message;
    }

    public BusinessException(String messageCode, String message, Throwable cause) {
        super(message, cause);
        this.messageCode = messageCode;
        this.message = message;
    }
}
