package com.manabihub.identity.service;

import com.manabihub.identity.dto.request.LoginRequest;
import com.manabihub.identity.dto.response.AdminProfileResponse;
import com.manabihub.identity.dto.response.LoginResponse;

import java.util.UUID;

public interface AdminAuthService {
    LoginResponse login(LoginRequest request, String ipAddress, String userAgent);
    AdminProfileResponse getMe(UUID adminId);
}
