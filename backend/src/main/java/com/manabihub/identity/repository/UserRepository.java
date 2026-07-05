package com.manabihub.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.manabihub.kyc.domain.AppUser;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmail(String email);

}