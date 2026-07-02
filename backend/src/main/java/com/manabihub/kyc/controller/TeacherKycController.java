package com.manabihub.kyc.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.dto.KycSubmissionResponse;
import com.manabihub.kyc.service.TeacherKycService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/teacher/kyc")
public class TeacherKycController {

    private static final UUID DEMO_TEACHER_USER_ID = UUID.fromString("d0000000-0000-0000-0000-000000000003");

    private final TeacherKycService teacherKycService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getStatus(
            @RequestHeader(value = "X-Demo-User-Id", required = false) UUID userId
    ) {
        KycStatusResponse response = teacherKycService.getStatus(resolveUserId(userId));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<KycSubmissionResponse>> submit(
            @RequestHeader(value = "X-Demo-User-Id", required = false) UUID userId,
            @RequestPart("cccdFront") MultipartFile cccdFront,
            @RequestPart("cccdBack") MultipartFile cccdBack,
            @RequestPart("selfie") MultipartFile selfie,
            @RequestPart("certificate") MultipartFile certificate,
            @RequestPart("copyrightAgreement") MultipartFile copyrightAgreement,
            @RequestParam("copyrightAgreementAccepted") boolean copyrightAgreementAccepted,
            @RequestParam(value = "certificateCode", required = false) String certificateCode,
            HttpServletRequest request
    ) {
        KycSubmissionResponse response = teacherKycService.submit(
                resolveUserId(userId),
                cccdFront,
                cccdBack,
                selfie,
                certificate,
                copyrightAgreement,
                copyrightAgreementAccepted,
                certificateCode,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                MessageCodes.MSG_KYC_003,
                "KYC documents submitted successfully. Status is Pending Admin Review.",
                response
        ));
    }

    private UUID resolveUserId(UUID userId) {
        return userId == null ? DEMO_TEACHER_USER_ID : userId;
    }
}
