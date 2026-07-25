package com.manabihub.identity.repository;

import com.manabihub.identity.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    Optional<StudentProfile> findByUser_Id(UUID userId);

    boolean existsByUserId(UUID userId);
}
