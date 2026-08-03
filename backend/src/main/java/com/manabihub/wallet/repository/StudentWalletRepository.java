package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.StudentWallet;
import org.springframework.data.repository.Repository;

import java.util.Optional;
import java.util.UUID;

/** @deprecated Read-only legacy projection. Balance writes belong to {@link WalletRepository}. */
@Deprecated(forRemoval = true)
public interface StudentWalletRepository extends Repository<StudentWallet, UUID> {

    Optional<StudentWallet> findByStudentId(UUID studentId);
}
