package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, UUID> {

    Optional<TeacherProfile> findByUserId(UUID userId);
}
