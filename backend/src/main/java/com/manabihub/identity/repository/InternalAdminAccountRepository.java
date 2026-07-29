package com.manabihub.identity.repository;

import com.manabihub.identity.entity.InternalAdminAccount;
import com.manabihub.identity.enums.AccountStatus;
import com.manabihub.identity.enums.RoleCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository("identityInternalAdminAccountRepository")
public interface InternalAdminAccountRepository extends JpaRepository<InternalAdminAccount, UUID> {
    Optional<InternalAdminAccount> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account
            from IdentityInternalAdminAccount account
            where lower(account.email) = lower(:email)
            """)
    Optional<InternalAdminAccount> findByEmailIgnoreCaseForUpdate(@Param("email") String email);

    @EntityGraph(attributePaths = "role")
    List<InternalAdminAccount> findAllByOrderByFullNameAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account
            from IdentityInternalAdminAccount account
            join fetch account.role
            where account.id = :accountId
            """)
    Optional<InternalAdminAccount> findByIdForRoleUpdate(@Param("accountId") UUID accountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account
            from IdentityInternalAdminAccount account
            where account.accountStatus = :status
              and account.role.code = :roleCode
            order by account.id
            """)
    List<InternalAdminAccount> findAllByStatusAndRoleCodeForUpdate(
            @Param("status") AccountStatus status,
            @Param("roleCode") RoleCode roleCode
    );
}
