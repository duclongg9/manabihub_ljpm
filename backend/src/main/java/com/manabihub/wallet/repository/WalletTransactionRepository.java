package com.manabihub.wallet.repository;

import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

    /**
     * UC-17 step 3 and 6: paginated, filterable transaction history.
     * <p>
     * Optional filters are expressed as collections and bounded instants rather
     * than nullable parameters, so the query never compares a {@code null}
     * bind parameter and stays portable across Hibernate versions. The service
     * widens each collection when the caller did not supply a filter.
     *
     * @param walletId   wallet to read
     * @param types      transaction types the caller is allowed and asked to see
     * @param directions IN, OUT, or both
     * @param from       inclusive lower bound on {@code createdAt}
     * @param to         inclusive upper bound on {@code createdAt}
     */
    @Query("""
            SELECT t FROM WalletTransaction t
            WHERE t.wallet.id = :walletId
              AND t.transactionType IN :types
              AND t.direction IN :directions
              AND t.createdAt >= :from
              AND t.createdAt <= :to
            ORDER BY t.createdAt DESC
            """)
    Page<WalletTransaction> search(
            @Param("walletId") UUID walletId,
            @Param("types") Collection<WalletTransactionType> types,
            @Param("directions") Collection<WalletTransactionDirection> directions,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );

    /**
     * Sum of a transaction type for a wallet, used to build the section totals
     * shown on the wallet overview. Returns {@code 0} when nothing matches.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.wallet.id = :walletId
              AND t.transactionType = :type
            """)
    BigDecimal sumAmountByType(
            @Param("walletId") UUID walletId,
            @Param("type") WalletTransactionType type
    );
}
