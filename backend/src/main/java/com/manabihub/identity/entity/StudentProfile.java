package com.manabihub.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "jlpt_goal", length = 20)
    private String jlptGoal;

    /** Demo-only identity verification evidence. The raw CCCD is never stored. */
    @Column(name = "identity_fingerprint", length = 64)
    private String identityFingerprint;

    @Column(name = "identity_provider", length = 64)
    private String identityProvider;

    @Column(name = "identity_full_name")
    private String identityFullName;

    @Column(name = "identity_date_of_birth")
    private java.time.LocalDate identityDateOfBirth;

    @Column(name = "identity_verified_at")
    private Instant identityVerifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
