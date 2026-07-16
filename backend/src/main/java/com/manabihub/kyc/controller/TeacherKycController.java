package com.manabihub.kyc.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.dto.KycCertificateSubmissionResponse;
import com.manabihub.kyc.dto.KycIdentityVerificationRequest;
import com.manabihub.kyc.dto.KycIdentityVerificationResponse;
import com.manabihub.kyc.dto.KycRestartVerificationResponse;
import com.manabihub.kyc.dto.KycStatusResponse;
import com.manabihub.kyc.service.TeacherKycService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/teacher/kyc")
public class TeacherKycController {

    private final TeacherKycService teacherKycService;
    private final CurrentUserService currentUserService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getStatus() {
        KycStatusResponse response = teacherKycService.getStatus(currentUserService.getCurrentUserId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/identity-verifications", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<KycIdentityVerificationResponse>> verifyIdentity(
            @RequestBody KycIdentityVerificationRequest payload,
            HttpServletRequest request
    ) {
        KycIdentityVerificationResponse response = teacherKycService.verifyIdentity(
                currentUserService.getCurrentUserId(),
                payload,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.MSG_KYC_003,
                "Identity verification result was recorded.",
                response
        ));
    }

    @PostMapping("/restart-verification")
    public ResponseEntity<ApiResponse<KycRestartVerificationResponse>> restartVerification(
            HttpServletRequest request
    ) {
        KycRestartVerificationResponse response = teacherKycService.restartVerification(
                currentUserService.getCurrentUserId(),
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.ok(ApiResponse.success(
                MessageCodes.MSG_KYC_003,
                "Teacher verification was restarted.",
                response
        ));
    }

    @PostMapping(value = "/certificate-submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<KycCertificateSubmissionResponse>> submitCertificate(
            @RequestPart("certificate") MultipartFile certificate,
            @RequestParam("copyrightAgreementAccepted") boolean copyrightAgreementAccepted,
            @RequestParam("certificateCode") String certificateCode,
            HttpServletRequest request
    ) {
        KycCertificateSubmissionResponse response = teacherKycService.submitCertificate(
                currentUserService.getCurrentUserId(),
                certificate,
                certificateCode,
                copyrightAgreementAccepted,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                MessageCodes.MSG_KYC_003,
                "Certificate submitted successfully. KYC is waiting for registry matching.",
                response
        ));
    }
}
