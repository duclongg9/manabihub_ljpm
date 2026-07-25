package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByStudent_Id(UUID studentProfileId);

    Optional<Wallet> findByTeacher_Id(UUID teacherProfileId);
}
