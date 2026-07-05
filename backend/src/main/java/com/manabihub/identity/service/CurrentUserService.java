package com.manabihub.identity.service;

import java.util.UUID;

/**
 * Provides information about the currently authenticated user.
 * <p>
 * Iteration 1:
 * Returns a demo user for testing.
 * <p>
 * Future:
 * This service will obtain the current user from Spring Security
 * after Google OAuth and JWT authentication are implemented.
 */
public interface CurrentUserService {

    /**
     * Returns the current authenticated user's ID.
     *
     * @return current user's UUID
     */
    UUID getCurrentUserId();

}