package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.enums.WalletOwnerType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByOwnerTypeAndStudent_Id(WalletOwnerType ownerType, UUID studentId);

    Optional<Wallet> findByOwnerTypeAndTeacher_Id(WalletOwnerType ownerType, UUID teacherId);

    Optional<Wallet> findFirstByOwnerType(WalletOwnerType ownerType);

    /** Locks the wallet row before mutating its balance to avoid lost updates. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.id = :id")
    Optional<Wallet> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.ownerType = :ownerType AND w.teacher.id = :teacherId")
    Optional<Wallet> findByOwnerTypeAndTeacher_IdForUpdate(@Param("ownerType") WalletOwnerType ownerType, @Param("teacherId") UUID teacherId);
}
