package com.manabihub.kyc.service;

import com.manabihub.kyc.domain.IdentityVerificationStatus;
import com.manabihub.kyc.domain.KycRequest;
import com.manabihub.kyc.domain.TeacherIdentityClaim;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherIdentityClaimRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class TeacherIdentityClaimBackfillRunner {

    private final KycRequestRepository kycRequestRepository;
    private final TeacherIdentityClaimRepository claimRepository;
    private final TeacherIdentityClaimService claimService;

    public TeacherIdentityClaimBackfillRunner(
            KycRequestRepository kycRequestRepository,
            TeacherIdentityClaimRepository claimRepository,
            TeacherIdentityClaimService claimService
    ) {
        this.kycRequestRepository = kycRequestRepository;
        this.claimRepository = claimRepository;
        this.claimService = claimService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillExistingIdentityClaims() {
        log.info("Checking for unmapped historical KYC identity claims to backfill...");
        List<KycRequest> verifiedRequests = kycRequestRepository.findAll().stream()
                .filter(req -> req.getIdentityStatus() == IdentityVerificationStatus.VERIFIED)
                .filter(req -> req.getTeacherProfile() != null)
                .toList();

        int backfilledCount = 0;
        for (KycRequest request : verifiedRequests) {
            UUID teacherId = request.getTeacherProfile().getId();
            if (claimRepository.findByTeacherId(teacherId).isPresent()) {
                continue;
            }

            String idNumber = extractIdNumber(request.getVerificationPayload());
            if (StringUtils.hasText(idNumber)) {
                try {
                    String normalized = claimService.normalizeCccd(idNumber);
                    String fingerprint = claimService.generateFingerprint(normalized);

                    if (claimRepository.findByIdentityFingerprint(fingerprint).isEmpty()) {
                        TeacherIdentityClaim claim = TeacherIdentityClaim.builder()
                                .teacherId(teacherId)
                                .identityFingerprint(fingerprint)
                                .build();
                        claimRepository.save(claim);
                        backfilledCount++;
                    }
                } catch (Exception ex) {
                    log.warn("Could not backfill identity claim for teacher {}: {}", teacherId, ex.getMessage());
                }
            }
        }
        log.info("Identity claim backfill process finished. Backfilled {} profiles.", backfilledCount);
    }

    private String extractIdNumber(Map<String, Object> payload) {
        if (payload == null) {
            return null;
        }
        Object ocrObj = payload.get("identityOcr");
        if (ocrObj instanceof Map<?, ?> ocrMap) {
            Object idVal = ocrMap.get("idNumber");
            return idVal != null ? String.valueOf(idVal) : null;
        }
        return null;
    }
}
