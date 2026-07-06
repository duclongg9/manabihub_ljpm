package com.manabihub.identity.controller;

import com.manabihub.common.response.ApiResponse;
import com.manabihub.identity.dto.request.LoginRequest;
import com.manabihub.identity.dto.response.AdminProfileResponse;
import com.manabihub.identity.dto.response.LoginResponse;
import com.manabihub.identity.service.AdminAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
@Tag(name = "Admin Authentication", description = "Internal Admin Portal Authentication APIs")
// [CODE NOTE - UC-03]: Controller xử lý API cho Admin Portal.
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @Operation(summary = "Login to Admin Portal", description = "Authenticates internal admins via email/password and returns a JWT.")
    // [CODE NOTE - UC-03]: API Đăng nhập dành riêng cho Admin Portal (Username/Password), độc lập với App User (Google OAuth).
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        LoginResponse response = adminAuthService.login(request, ipAddress, userAgent);
        return ApiResponse.success(response);
    }

    @Operation(summary = "Get current admin profile", description = "Returns the profile and role of the currently logged-in admin.")
    // [CODE NOTE - UC-03]: API lấy thông tin Admin hiện tại, trả về Permission/Role để Frontend làm menu routing.
    @GetMapping("/me")
    public ApiResponse<AdminProfileResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        // Jwt is auto-injected by Spring Security BearerTokenAuthenticationFilter
        UUID adminId = UUID.fromString(jwt.getSubject());
        AdminProfileResponse response = adminAuthService.getMe(adminId);
        return ApiResponse.success(response);
    }
}
