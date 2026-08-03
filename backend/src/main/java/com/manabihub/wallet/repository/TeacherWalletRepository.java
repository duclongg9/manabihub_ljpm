package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.TeacherWallet;
import org.springframework.data.repository.Repository;

import java.util.Optional;

/** @deprecated Read-only legacy projection. Balance writes belong to {@link WalletRepository}. */
@Deprecated(forRemoval = true)
public interface TeacherWalletRepository extends Repository<TeacherWallet, java.util.UUID> {

    Optional<TeacherWallet> findByTeacherId(java.util.UUID teacherId);
}
