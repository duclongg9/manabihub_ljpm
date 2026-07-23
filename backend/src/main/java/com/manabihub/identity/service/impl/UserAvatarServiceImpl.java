package com.manabihub.identity.service.impl;

import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.identity.service.UserAvatarService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class UserAvatarServiceImpl implements UserAvatarService {

    private final AppUserRepository appUserRepository;
    private final CurrentUserService currentUserService;
    private final AuditLogService auditLogService;
    private final Path storageRoot;
    private final String publicPathPrefix;

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    public UserAvatarServiceImpl(
            AppUserRepository appUserRepository,
            CurrentUserService currentUserService,
            AuditLogService auditLogService,
            @Value("${manabihub.user.avatar-storage-root:storage/user-avatars}") String storageRoot,
            @Value("${manabihub.user.avatar-public-path:/uploads/user-avatars}") String publicPathPrefix
    ) {
        this.appUserRepository = appUserRepository;
        this.currentUserService = currentUserService;
        this.auditLogService = auditLogService;
        this.storageRoot = Path.of(storageRoot).toAbsolutePath().normalize();
        this.publicPathPrefix = publicPathPrefix.endsWith("/")
                ? publicPathPrefix.substring(0, publicPathPrefix.length() - 1)
                : publicPathPrefix;
    }

    @Override
    @Transactional
    public String uploadAvatar(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "File is empty", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "File size exceeds 2MB", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "Invalid file type. Only JPEG, PNG, and WebP are allowed", HttpStatus.BAD_REQUEST);
        }

        UUID userId = currentUserService.getCurrentUserId();
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

        String originalFilename = file.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (!StringUtils.hasText(extension)) {
            extension = "png"; // default if missing
        }

        String newFilename = UUID.randomUUID().toString() + "." + extension;
        Path targetPath = storageRoot.resolve(newFilename).normalize();

        if (!targetPath.startsWith(storageRoot)) {
            throw new BusinessException(MessageCodes.COMMON_BAD_REQUEST, "Invalid file path", HttpStatus.BAD_REQUEST);
        }

        try {
            Files.createDirectories(storageRoot);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Failed to store avatar file", e);
            throw new BusinessException(MessageCodes.COMMON_INTERNAL_ERROR, "Failed to store avatar file", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String stableUrl = publicPathPrefix + "/" + newFilename;
        String oldAvatarUrl = user.getAvatarUrl();
        user.setAvatarUrl(stableUrl);
        appUserRepository.save(user);

        // Audit log
        Map<String, Object> before = oldAvatarUrl != null ? Map.of("avatarUrl", oldAvatarUrl) : Map.of();
        Map<String, Object> after = Map.of("avatarUrl", stableUrl);
        auditLogService.logUserAction(
                userId,
                null,
                "UPDATE_AVATAR",
                "AppUser",
                userId,
                before,
                after,
                Map.of("filename", newFilename)
        );

        return stableUrl;
    }
}
