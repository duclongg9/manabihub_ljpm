package com.manabihub.kyc.entity;

import com.manabihub.identity.entity.User;
import com.manabihub.kyc.enums.KycStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kyc_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycRequest {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus status;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "id_card_front_url")
    private String idCardFrontUrl;

    @Column(name = "id_card_back_url")
    private String idCardBackUrl;

    @Column(name = "certificate_url")
    private String certificateUrl;

    @Column(name = "selfie_url")
    private String selfieUrl;

    @Column(name = "copyright_accepted", nullable = false)
    private Boolean copyrightAccepted;

    @Column(name = "vnpt_verification_status")
    private String vnptVerificationStatus;

    @Column(name = "vnpt_response_details", columnDefinition = "TEXT")
    private String vnptResponseDetails;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "decision_note")
    private String decisionNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (copyrightAccepted == null) {
            copyrightAccepted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
