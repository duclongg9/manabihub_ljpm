package com.manabihub.identity.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.identity.dto.request.UpdateStudentProfileRequest;
import com.manabihub.identity.dto.response.StudentProfileResponse;
import com.manabihub.identity.service.StudentProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/student/profile")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getMyProfile() {

        StudentProfileResponse response =
                studentProfileService.getMyProfile();

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.COMMON_SUCCESS,
                        "Success",
                        response
                )
        );
    }

    @PutMapping
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateStudentProfileRequest request
    ) {

        StudentProfileResponse response =
                studentProfileService.updateMyProfile(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        MessageCodes.MSG_PRO_001,
                        "Profile updated successfully",
                        response
                )
        );
    }

}