package com.manabihub.finance.repository;

import com.manabihub.finance.entity.SystemExpense;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SystemExpenseRepository
        extends JpaRepository<SystemExpense, UUID>, JpaSpecificationExecutor<SystemExpense> {

    @EntityGraph(attributePaths = "lines")
    @Query("select expense from SystemExpense expense where expense.id = :id")
    Optional<SystemExpense> findDetailById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "lines")
    @Query("select expense from SystemExpense expense where expense.id = :id")
    Optional<SystemExpense> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByProviderCodeIgnoreCaseAndInvoiceNumberIgnoreCase(
            String providerCode,
            String invoiceNumber
    );

    boolean existsByProviderCodeIgnoreCaseAndInvoiceNumberIgnoreCaseAndIdNot(
            String providerCode,
            String invoiceNumber,
            UUID id
    );
}
