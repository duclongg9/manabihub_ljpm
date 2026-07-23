package com.manabihub.identity.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.repository.AppUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import com.manabihub.identity.service.CurrentUserService;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAvatarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppUserRepository appUserRepository;

    @MockBean
    private CurrentUserService currentUserService;

    private AppUser studentUser;
    private AppUser adminUser;
    private Path tempAvatarDir;

    @BeforeEach
    void setUp() throws Exception {
        appUserRepository.deleteAll();

        studentUser = AppUser.builder()
                .email("student_avatar_test@example.com")
                .fullName("Student Name")
                .build();
        studentUser = appUserRepository.save(studentUser);

        adminUser = AppUser.builder()
                .email("admin_avatar_test@example.com")
                .fullName("Admin Name")
                .build();
        adminUser = appUserRepository.save(adminUser);
    }

    @AfterEach
    void tearDown() {
        appUserRepository.deleteAll();
    }

    @Test
    @DisplayName("Upload avatar - Success for STUDENT")
    @WithMockUser(roles = {"STUDENT"})
    void uploadAvatar_Success_Student() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(studentUser.getId());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                "dummy image content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/users/avatar")
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.startsWith("/uploads/user-avatars/")));

        // Verify DB update
        AppUser updatedUser = appUserRepository.findById(studentUser.getId()).orElseThrow();
        assertNotNull(updatedUser.getAvatarUrl());
        assertTrue(updatedUser.getAvatarUrl().startsWith("/uploads/user-avatars/"));
    }

    @Test
    @DisplayName("Upload avatar - Unauthenticated returns 401")
    void uploadAvatar_Unauthenticated_401() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "img".getBytes());

        mockMvc.perform(multipart("/api/v1/users/avatar")
                        .file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Upload avatar - ADMIN returns 403")
    @WithMockUser(roles = {"ADMIN"})
    void uploadAvatar_Admin_403() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(adminUser.getId());

        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "img".getBytes());

        mockMvc.perform(multipart("/api/v1/users/avatar")
                        .file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Upload avatar - Invalid MIME type returns 400")
    @WithMockUser(roles = {"STUDENT"})
    void uploadAvatar_InvalidMimeType_400() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(studentUser.getId());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "dummy pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/users/avatar")
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.messageCode").value(MessageCodes.COMMON_BAD_REQUEST));
    }
}
