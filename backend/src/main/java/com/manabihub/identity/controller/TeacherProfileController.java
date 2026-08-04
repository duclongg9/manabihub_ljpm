package com.manabihub.identity.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.identity.dto.request.UpdateTeacherProfileRequest;
import com.manabihub.identity.dto.response.TeacherProfileResponse;
import com.manabihub.identity.service.TeacherProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teacher/profile")
@RequiredArgsConstructor
public class TeacherProfileController {

    private final TeacherProfileService teacherProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<TeacherProfileResponse>> getMyProfile() {

        TeacherProfileResponse response =
                teacherProfileService.getMyProfile();

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.COMMON_SUCCESS,
                        "Success",
                        response
                )
        );
    }

    @PutMapping
    public ResponseEntity<ApiResponse<TeacherProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateTeacherProfileRequest request
    ) {

        TeacherProfileResponse response =
                teacherProfileService.updateMyProfile(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.MSG_PRO_001,
                        "Profile updated successfully",
                        response
                )
        );
    }

}