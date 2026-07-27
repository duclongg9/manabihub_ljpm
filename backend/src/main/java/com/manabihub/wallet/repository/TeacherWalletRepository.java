package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.TeacherWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TeacherWalletRepository extends JpaRepository<TeacherWallet, java.util.UUID> {

    Optional<TeacherWallet> findByTeacherId(java.util.UUID teacherId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tw FROM TeacherWallet tw WHERE tw.teacherId = :teacherId")
    Optional<TeacherWallet> findByTeacherIdForUpdate(@Param("teacherId") java.util.UUID teacherId);
}
