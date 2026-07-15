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
        return getCurrentUserIdOptional().orElse(DEMO_USER_ID);
    }

    @Override
    public java.util.Optional<UUID> getCurrentUserIdOptional() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            return java.util.Optional.empty();
        }
        
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            try {
                return java.util.Optional.of(UUID.fromString(jwtAuth.getName()));
            } catch (IllegalArgumentException e) {
                // Invalid UUID format
                return java.util.Optional.empty();
            }
        }
        
        try {
            return java.util.Optional.of(UUID.fromString(authentication.getName()));
        } catch (IllegalArgumentException e) {
            return java.util.Optional.empty();
        }
    }

    @Override
    public boolean hasRole(String role) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String targetRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(targetRole));
    }
}