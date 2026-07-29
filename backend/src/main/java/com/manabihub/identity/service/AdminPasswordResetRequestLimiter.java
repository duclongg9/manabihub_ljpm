package com.manabihub.identity.service;

import org.springframework.stereotype.Component;

@Component
public class AdminPasswordResetRequestLimiter {

    private static final int WINDOW_SECONDS = 15 * 60;
    private static final int BLOCK_SECONDS = 15 * 60;

    private final DatabaseAuthRateLimiter rateLimiter;

    public AdminPasswordResetRequestLimiter(DatabaseAuthRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    public boolean allow(String normalizedEmail, String ipAddress) {
        boolean ipAllowed = rateLimiter.consume(
                "admin-password-reset-ip",
                ipAddress,
                "ADMIN_PASSWORD_FORGOT",
                10,
                WINDOW_SECONDS,
                BLOCK_SECONDS
        );
        if (!ipAllowed) {
            return false;
        }
        return rateLimiter.consume(
                "admin-password-reset-email",
                normalizedEmail,
                "ADMIN_PASSWORD_FORGOT",
                3,
                WINDOW_SECONDS,
                BLOCK_SECONDS
        );
    }
}
