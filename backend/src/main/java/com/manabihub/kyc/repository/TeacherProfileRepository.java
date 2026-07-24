package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.TeacherProfile;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, UUID> {

    Optional<TeacherProfile> findByUserId(UUID userId);

    @Modifying
    @Query(value = """
            INSERT INTO teacher_profiles (
                id,
                user_id,
                display_name,
                kyc_status,
                can_publish_course
            )
            SELECT
                :profileId,
                app_user.id,
                app_user.full_name,
                'NOT_SUBMITTED',
                FALSE
            FROM app_users app_user
            WHERE app_user.id = :userId
            ON CONFLICT (user_id) DO NOTHING
            """, nativeQuery = true)
    int createCandidateIfAbsent(
            @Param("profileId") UUID profileId,
            @Param("userId") UUID userId
    );
}
