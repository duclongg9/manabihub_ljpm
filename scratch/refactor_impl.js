const fs = require('fs');
const path = 'backend/src/main/java/com/manabihub/kyc/service/TeacherKycService.java';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove raw payloads from verificationPayload in submitIdentityVerification
const payloadTarget = `        kycRequest.setVerificationPayload(Map.of(
                "identityProvider", VNPT_PROVIDER,
                "providerResult", request.sdkResult() == null ? Map.of() : request.sdkResult(),
                "providerStatus", sdkPassed ? "SDK_PENDING_SERVER_CONFIRM" : "SDK_FAILED",
                "identityOcr", sdkDecision.identityOcr(),
                "failureReasons", failureReasons,
                "certificateManualAuthenticityReviewRequired", true,
                "autoApproval", false,
                "serverVerificationRequired", sdkPassed,
                "srs", srsTrace()
        ));`;

const payloadReplacement = `        kycRequest.setVerificationPayload(Map.of(
                "identityProvider", VNPT_PROVIDER,
                "providerStatus", sdkPassed ? "SDK_PENDING_SERVER_CONFIRM" : "SDK_FAILED",
                "failureReasons", failureReasons,
                "certificateManualAuthenticityReviewRequired", true,
                "autoApproval", false,
                "serverVerificationRequired", sdkPassed,
                "srs", srsTrace()
        ));`;

content = content.replace(payloadTarget, payloadReplacement);

// 2. Refactor confirmServerVerification
const confirmServerTargetStart = `        if (serverResult.verified()) {
            // Server confirmed — now we can trust the identity`;

const confirmServerTargetEnd = `        } else {
            // Server rejected
            kycRequest.setIdentityStatus(IdentityVerificationStatus.FAILED);
            log.warn("Server verification REJECTED for request {}: {}",
                    kycRequest.getId(), serverResult.failureReasons());
        }`;

// We will use regex to replace the entire block
const confirmServerRegex = /if \(serverResult\.verified\(\)\) \{\s*\/\/ Server confirmed[\s\S]*?log\.warn\("Server verification REJECTED for request \{\}: \{\}",\s*kycRequest\.getId\(\), serverResult\.failureReasons\(\)\);\s*\}/;

const confirmServerReplacement = `if (serverResult.verified()) {
            if (!txId.equals(serverResult.transactionId())) {
                log.warn("Server verification mismatch: expected txId {} but got {}", txId, serverResult.transactionId());
                kycRequest.setIdentityStatus(IdentityVerificationStatus.FAILED);
            } else if (!org.springframework.util.StringUtils.hasText(serverResult.serverIdNumber())) {
                log.warn("Server verified but no identity data provided for request {}", kycRequest.getId());
                kycRequest.setIdentityStatus(IdentityVerificationStatus.FAILED);
            } else {
                // Server confirmed — now we can trust the identity
                kycRequest.setIdentityStatus(IdentityVerificationStatus.VERIFIED);
                kycRequest.setIdentityVerifiedAt(now);
                kycRequest.setServerVerifiedAt(now);
                kycRequest.setCertificateStatus(CertificateVerificationStatus.LOCKED);

                // Add server payload to verification payload
                java.util.Map<String, Object> currentPayload = new java.util.HashMap<>(kycRequest.getVerificationPayload());
                currentPayload.put("providerStatus", serverResult.providerStatus());
                if (serverResult.maskedReference() != null) {
                    currentPayload.put("serverReference", serverResult.maskedReference());
                }
                kycRequest.setVerificationPayload(currentPayload);

                // NOW process the identity claim (CCCD fingerprint) using SERVER data
                try {
                    String normalizedCccd = teacherIdentityClaimService.normalizeCccd(serverResult.serverIdNumber());
                    teacherIdentityClaimService.processIdentityClaim(
                            teacherProfile.getId(),
                            normalizedCccd,
                            user,
                            ipAddress,
                            userAgent
                    );
                    // Unlock certificate only if claim processing is successful
                    kycRequest.setCertificateStatus(CertificateVerificationStatus.NOT_SUBMITTED);
                } catch (BusinessException ex) {
                    log.warn("Identity claim processing failed after server verification: {}", ex.getMessage());
                    kycRequest.setIdentityStatus(IdentityVerificationStatus.FAILED);
                    kycRequest.setIdentityVerifiedAt(null);
                    kycRequest.setServerVerifiedAt(null);
                }
            }
        } else {
            // Server rejected
            kycRequest.setIdentityStatus(IdentityVerificationStatus.FAILED);
            java.util.Map<String, Object> currentPayload = new java.util.HashMap<>(kycRequest.getVerificationPayload());
            currentPayload.put("providerStatus", serverResult.providerStatus());
            currentPayload.put("reasonCode", serverResult.reasonCode());
            currentPayload.put("failureReasons", serverResult.failureReasons());
            kycRequest.setVerificationPayload(currentPayload);
            log.warn("Server verification REJECTED for request {}: {}",
                    kycRequest.getId(), serverResult.failureReasons());
        }`;

content = content.replace(confirmServerRegex, confirmServerReplacement);

// 3. One more thing: catch DataIntegrityViolationException on save due to unique index
const saveTarget = `        KycRequest savedRequest = kycRequestRepository.save(kycRequest);
        savedRequest.setEkycReferenceId("VNPT-SDK-" + savedRequest.getId());`;

const saveReplacement = `        KycRequest savedRequest;
        try {
            savedRequest = kycRequestRepository.save(kycRequest);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Concurrent VNPT transaction replay or cross-user violation: provider_transaction_id={}", request.providerTransactionId());
            throw new BusinessException(
                    MessageCodes.MSG_SYS_004,
                    "Invalid or duplicate verification transaction",
                    org.springframework.http.HttpStatus.BAD_REQUEST
            );
        }
        savedRequest.setEkycReferenceId("VNPT-SDK-" + savedRequest.getId());`;

content = content.replace(saveTarget, saveReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('TeacherKycService refactored.');
