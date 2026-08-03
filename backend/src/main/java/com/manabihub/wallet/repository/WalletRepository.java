package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.enums.WalletOwnerType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO wallets (
                id, owner_type, student_id, balance, frozen_balance, frozen, currency, created_at
            )
            VALUES (:walletId, 'STUDENT', :studentId, 0, 0, FALSE, 'VND', NOW())
            ON CONFLICT (student_id) WHERE student_id IS NOT NULL DO NOTHING
            """, nativeQuery = true)
    int insertStudentWalletIfAbsent(
            @Param("walletId") UUID walletId,
            @Param("studentId") UUID studentId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT wallet FROM Wallet wallet
            WHERE wallet.ownerType = com.manabihub.wallet.enums.WalletOwnerType.STUDENT
              AND wallet.student.id = :studentId
            """)
    Optional<Wallet> findStudentWalletForUpdate(@Param("studentId") UUID studentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT wallet FROM Wallet wallet
            WHERE wallet.ownerType = com.manabihub.wallet.enums.WalletOwnerType.TEACHER
              AND wallet.teacher.id = :teacherId
            """)
    Optional<Wallet> findTeacherWalletForUpdate(@Param("teacherId") UUID teacherId);

    /** Locks the wallet row before mutating its balance to avoid lost updates. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.id = :id")
    Optional<Wallet> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.ownerType = :ownerType AND w.teacher.id = :teacherId")
    Optional<Wallet> findByOwnerTypeAndTeacher_IdForUpdate(@Param("ownerType") WalletOwnerType ownerType, @Param("teacherId") UUID teacherId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.ownerType = :ownerType AND w.student.id = :studentId")
    Optional<Wallet> findByOwnerTypeAndStudent_IdForUpdate(@Param("ownerType") WalletOwnerType ownerType, @Param("studentId") UUID studentId);
}
