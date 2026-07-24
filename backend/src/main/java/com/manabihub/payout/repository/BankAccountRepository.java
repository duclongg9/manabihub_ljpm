package com.manabihub.payout.repository;

import com.manabihub.payout.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, String> {
    Optional<BankAccount> findByIdAndTeacherId(String id, String teacherId);
}
