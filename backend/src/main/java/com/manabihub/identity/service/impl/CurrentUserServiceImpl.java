package com.manabihub.identity.service.impl;

import com.manabihub.identity.service.CurrentUserService;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Demo implementation for Iteration 1.
 * <p>
 * TODO:
 * Replace this implementation with Spring Security after
 * Google OAuth + JWT authentication is completed.
 */
@Service
public class CurrentUserServiceImpl implements CurrentUserService {

    /**
     * Demo Student UUID.
     * <p>
     * This UUID must exist in the Flyway seed data.
     */
    private static final UUID DEMO_USER_ID =
            UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Override
    public UUID getCurrentUserId() {
        return DEMO_USER_ID;
    }
}