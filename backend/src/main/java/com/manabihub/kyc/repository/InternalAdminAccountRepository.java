package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.InternalAdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InternalAdminAccountRepository extends JpaRepository<InternalAdminAccount, UUID> {

    @Query(value = """
        SELECT DISTINCT admin.*
        FROM internal_admin_accounts admin
        JOIN internal_admin_roles admin_role ON admin_role.admin_account_id = admin.id
        JOIN roles role ON role.id = admin_role.role_id
        WHERE role.code IN (:roleCodes)
          AND admin.account_status = 'ACTIVE'
        """, nativeQuery = true)
    List<InternalAdminAccount> findActiveAdminsByRoleCodes(@Param("roleCodes") Collection<String> roleCodes);
}
