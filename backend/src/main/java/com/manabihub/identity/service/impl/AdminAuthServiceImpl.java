package com.manabihub.identity.service.impl;

import com.manabihub.audit.entity.AuditLog;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.dto.request.LoginRequest;
import com.manabihub.identity.dto.response.AdminProfileResponse;
import com.manabihub.identity.dto.response.LoginResponse;
import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.service.AdminAuthService;
import com.manabihub.systemconfig.service.SystemSettingValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
// [CODE NOTE - UC-03]: Class xử lý nghiệp vụ Đăng nhập của Admin bằng Username/Password (không dùng Google OAuth).
// Đáp ứng tiêu chí: "System Admin, Course Manager, and Finance Manager can log in through the same Admin Portal."
// Tại đây có triển khai quy tắc chống Brute-force (BR-AUTH-09) và ghi log kiểm toán (BR-AUD-01).
public class AdminAuthServiceImpl implements AdminAuthService {

    private final InternalAdminAccountRepository adminAccountRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final SystemSettingValueService settingValueService;

    @Value("${app.security.jwt.expiration-minutes:1440}") // Default 24 hours
    private long jwtExpirationMinutes;

    @Value("${app.security.lockout.max-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.security.lockout.duration-minutes:30}")
    private long lockoutDurationMinutes;

    // IN-MEMORY BRUTE FORCE PROTECTION (BR-AUTH-09)
    // Tradeoff: Lockout state is lost upon application restart. This avoids frequent DB writes on failed logins and avoids schema changes.
    private final Map<String, Integer> failedAttempts = new ConcurrentHashMap<>();
    private final Map<String, Instant> lockedAccounts = new ConcurrentHashMap<>();

    @Override
    @Transactional
    // [CODE NOTE - UC-03]: Hàm login() xử lý xác thực email/password.
    // - Đáp ứng tiêu chí: "Invalid/locked login is handled safely with generic error response." (Báo lỗi chung MSG-AUTH-007).
    // - Đáp ứng tiêu chí: "Locked/disabled internal account cannot log in." (Kiểm tra AccountStatus và In-memory lock).
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail();
        checkInMemoryLock(email);

        InternalAdminAccount account = adminAccountRepository.findByEmail(email)
                .orElse(null);

        // General error for security (EX-03) - Trả về lỗi chung, không tiết lộ tài khoản có tồn tại hay không
        if (account == null) {
            handleFailedAttempt(email);
            throw new BusinessException(MessageCodes.MSG_AUTH_007, "Admin login failed");
        }

        if (account.getAccountStatus() != AccountStatus.ACTIVE) {
            logAudit(account.getId(), account.getRole().getCode().name(), "LOGIN_FAILED", "DISABLED_ACCOUNT", ipAddress, userAgent);
            throw new BusinessException(MessageCodes.MSG_AUTH_007, "Admin login failed");
        }

        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            handleFailedAttempt(email);
            logAudit(account.getId(), account.getRole().getCode().name(), "LOGIN_FAILED", "INVALID_PASSWORD", ipAddress, userAgent);
            throw new BusinessException(MessageCodes.MSG_AUTH_007, "Admin login failed");
        }

        // Success -> reset attempts
        resetAttempts(email);

        // Update last login
        account.setLastLoginAt(Instant.now());
        adminAccountRepository.save(account);

        // Generate JWT
        String token = generateJwtToken(account);

        // Audit Log
        logAudit(account.getId(), account.getRole().getCode().name(), "LOGIN_SUCCESS", "AUTH", ipAddress, userAgent);

        return new LoginResponse(token);
    }

    // [CODE NOTE - UC-03]: Hàm getMe() trả về thông tin Profile bao gồm cả Role (SYSTEM_ADMIN, COURSE_MANAGER...).
    // Đáp ứng tiêu chí: "Backend returns permission/role information for menu routing".
    @Override
    @Transactional(readOnly = true)
    public AdminProfileResponse getMe(UUID adminId) {
        InternalAdminAccount account = adminAccountRepository.findById(java.util.Objects.requireNonNull(adminId))
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Account not found"));

        return AdminProfileResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .fullName(account.getFullName())
                .role(account.getRole().getCode().name())
                .build();
    }

    private void checkInMemoryLock(String email) {
        Instant lockTime = lockedAccounts.get(email);
        if (lockTime != null) {
            if (Instant.now().isBefore(lockTime)) {
                throw new BusinessException(MessageCodes.MSG_AUTH_008, "Admin account locked"); // EX-04
            } else {
                lockedAccounts.remove(email);
                failedAttempts.remove(email);
            }
        }
    }

    private void handleFailedAttempt(String email) {
        int attempts = failedAttempts.getOrDefault(email, 0) + 1;
        failedAttempts.put(email, attempts);
        int configuredMaxAttempts = settingValueService.getInteger(
                "ADMIN_LOCKOUT_MAX_ATTEMPTS",
                maxFailedAttempts
        );
        int configuredDurationMinutes = settingValueService.getInteger(
                "ADMIN_LOCKOUT_DURATION_MINUTES",
                Math.toIntExact(lockoutDurationMinutes)
        );
        if (attempts >= configuredMaxAttempts) {
            lockedAccounts.put(
                    email,
                    Instant.now().plus(configuredDurationMinutes, ChronoUnit.MINUTES)
            );
            log.warn(
                    "Account {} locked temporarily in memory for {} minutes due to {} failed attempts.",
                    email,
                    configuredDurationMinutes,
                    attempts
            );
        }
    }

    private void resetAttempts(String email) {
        failedAttempts.remove(email);
        lockedAccounts.remove(email);
    }

    private String generateJwtToken(InternalAdminAccount account) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("manabihub")
                .issuedAt(now)
                .expiresAt(now.plus(jwtExpirationMinutes, ChronoUnit.MINUTES))
                .subject(account.getId().toString())
                .claim("email", account.getEmail())
                // [CODE NOTE - UC-03]: Nhúng Role vào JWT Claim. Đáp ứng tiêu chí "Internal role is loaded after successful login."
                .claim("role", account.getRole().getCode().name())
                .build();

        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    private void logAudit(UUID adminId, String role, String action, String targetType, String ipAddress, String userAgent) {
        AuditLog auditLog = AuditLog.builder()
                .actorType("INTERNAL_ADMIN")
                .actorAdminId(adminId)
                .actorRoleCode(role)
                .action(action)
                .targetType(targetType)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        auditLogRepository.save(java.util.Objects.requireNonNull(auditLog));
    }
}
