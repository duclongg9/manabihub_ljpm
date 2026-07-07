package com.manabihub.identity.repository;

import com.manabihub.identity.entity.InternalAdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository("identityInternalAdminAccountRepository")
public interface InternalAdminAccountRepository extends JpaRepository<InternalAdminAccount, UUID> {
    Optional<InternalAdminAccount> findByEmail(String email);
}
