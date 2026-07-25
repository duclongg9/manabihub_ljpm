package com.manabihub.course.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.nio.file.Files;

@Configuration
public class CourseAssetStaticResourceConfig implements WebMvcConfigurer {

    private final Path thumbnailStorageRoot;
    private final String publicPathPrefix;

    public CourseAssetStaticResourceConfig(
            @Value("${manabihub.course.thumbnail-storage-root:storage/course-thumbnails}") String thumbnailStorageRoot,
            @Value("${manabihub.course.thumbnail-public-path:/uploads/course-thumbnails}") String publicPathPrefix
    ) {
        this.thumbnailStorageRoot = Path.of(thumbnailStorageRoot).toAbsolutePath().normalize();
        this.publicPathPrefix = publicPathPrefix.endsWith("/")
                ? publicPathPrefix.substring(0, publicPathPrefix.length() - 1)
                : publicPathPrefix;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Files.createDirectories(thumbnailStorageRoot);
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not create course thumbnail storage directory", exception);
        }

        String storageLocation = thumbnailStorageRoot.toUri().toString();
        if (!storageLocation.endsWith("/")) {
            storageLocation = storageLocation + "/";
        }

        registry.addResourceHandler(publicPathPrefix + "/**")
                .addResourceLocations(storageLocation);
    }
}
