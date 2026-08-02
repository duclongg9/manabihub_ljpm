package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.StudentWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StudentWalletRepository extends JpaRepository<StudentWallet, UUID> {

    Optional<StudentWallet> findByStudentId(UUID studentId);

    /** Locks the student wallet row before mutating its balance (top-up credit). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sw FROM StudentWallet sw WHERE sw.studentId = :studentId")
    Optional<StudentWallet> findByStudentIdForUpdate(@Param("studentId") UUID studentId);
}
