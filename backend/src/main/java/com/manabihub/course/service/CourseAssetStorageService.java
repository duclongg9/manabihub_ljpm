package com.manabihub.course.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.response.CourseThumbnailUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class CourseAssetStorageService {

    private static final long MAX_THUMBNAIL_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_THUMBNAIL_TYPES = Set.of("image/jpeg", "image/png");

    private final Path thumbnailStorageRoot;
    private final String publicPathPrefix;

    public CourseAssetStorageService(
            @Value("${manabihub.course.thumbnail-storage-root:storage/course-thumbnails}") String thumbnailStorageRoot,
            @Value("${manabihub.course.thumbnail-public-path:/uploads/course-thumbnails}") String publicPathPrefix
    ) {
        this.thumbnailStorageRoot = Path.of(thumbnailStorageRoot).toAbsolutePath().normalize();
        this.publicPathPrefix = publicPathPrefix.endsWith("/")
                ? publicPathPrefix.substring(0, publicPathPrefix.length() - 1)
                : publicPathPrefix;
    }

    public CourseThumbnailUploadResponse storeThumbnail(MultipartFile thumbnail) {
        validateThumbnail(thumbnail);

        String contentType = thumbnail.getContentType();
        String extension = "image/png".equals(contentType) ? "png" : "jpg";
        String fileName = "course-thumbnail-" + UUID.randomUUID() + "." + extension;
        Path targetPath = thumbnailStorageRoot.resolve(fileName).normalize();

        if (!targetPath.startsWith(thumbnailStorageRoot)) {
            throw new BusinessException(MessageCodes.MSG_COURSE_005, "Invalid course thumbnail storage path");
        }

        try {
            Files.createDirectories(thumbnailStorageRoot);
            try (InputStream inputStream = thumbnail.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BusinessException(
                    MessageCodes.MSG_COURSE_005,
                    "Could not store course thumbnail",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    exception
            );
        }

        return new CourseThumbnailUploadResponse(
                publicPathPrefix + "/" + fileName,
                fileName,
                contentType,
                thumbnail.getSize()
        );
    }

    private void validateThumbnail(MultipartFile thumbnail) {
        if (thumbnail == null || thumbnail.isEmpty()) {
            throw new BusinessException(MessageCodes.MSG_COURSE_005, "Course thumbnail file is required");
        }

        if (thumbnail.getSize() > MAX_THUMBNAIL_SIZE_BYTES) {
            throw new BusinessException(MessageCodes.MSG_COURSE_005, "Course thumbnail must not exceed 5MB");
        }

        if (!ALLOWED_THUMBNAIL_TYPES.contains(thumbnail.getContentType())) {
            throw new BusinessException(MessageCodes.MSG_COURSE_005, "Course thumbnail must be PNG or JPG");
        }
    }
}
