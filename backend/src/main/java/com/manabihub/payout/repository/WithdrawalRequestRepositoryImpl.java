package com.manabihub.payout.repository;

import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.payout.entity.PayoutSettlement;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.AbstractQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.query.QueryUtils;
import org.springframework.data.support.PageableExecutionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Dynamic implementation of the Finance payout queue lookup.
 *
 * <p>The previous JPQL used the {@code :param IS NULL OR <condition>} idiom. On
 * PostgreSQL that fails with {@code could not determine data type of parameter $N}:
 * a placeholder whose only use is {@code $N IS NULL} carries no type information,
 * and the driver rejects the statement at parse time — before any value is bound,
 * so it broke every request rather than only the unfiltered ones. Building the
 * predicates here means an omitted filter contributes no placeholder at all.
 */
public class WithdrawalRequestRepositoryImpl implements WithdrawalRequestRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<WithdrawalRequest> findPayoutQueue(
            WithdrawalStatus status,
            ReconciliationStatus reconciliationStatus,
            String ownerKeyword,
            LocalDateTime requestedFrom,
            LocalDateTime requestedTo,
            Pageable pageable
    ) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<WithdrawalRequest> query = builder.createQuery(WithdrawalRequest.class);
        Root<WithdrawalRequest> request = query.from(WithdrawalRequest.class);

        query.select(request).where(buildPredicates(
                builder, query, request,
                status, reconciliationStatus, ownerKeyword, requestedFrom, requestedTo));
        if (pageable.getSort().isSorted()) {
            query.orderBy(QueryUtils.toOrders(pageable.getSort(), request, builder));
        }

        TypedQuery<WithdrawalRequest> typedQuery = entityManager.createQuery(query);
        if (pageable.isPaged()) {
            typedQuery.setFirstResult((int) pageable.getOffset());
            typedQuery.setMaxResults(pageable.getPageSize());
        }

        return PageableExecutionUtils.getPage(
                typedQuery.getResultList(),
                pageable,
                () -> count(
                        builder, status, reconciliationStatus,
                        ownerKeyword, requestedFrom, requestedTo));
    }

    private long count(
            CriteriaBuilder builder,
            WithdrawalStatus status,
            ReconciliationStatus reconciliationStatus,
            String ownerKeyword,
            LocalDateTime requestedFrom,
            LocalDateTime requestedTo
    ) {
        CriteriaQuery<Long> query = builder.createQuery(Long.class);
        Root<WithdrawalRequest> request = query.from(WithdrawalRequest.class);

        query.select(builder.count(request)).where(buildPredicates(
                builder, query, request,
                status, reconciliationStatus, ownerKeyword, requestedFrom, requestedTo));

        return entityManager.createQuery(query).getSingleResult();
    }

    private Predicate[] buildPredicates(
            CriteriaBuilder builder,
            AbstractQuery<?> query,
            Root<WithdrawalRequest> request,
            WithdrawalStatus status,
            ReconciliationStatus reconciliationStatus,
            String ownerKeyword,
            LocalDateTime requestedFrom,
            LocalDateTime requestedTo
    ) {
        List<Predicate> predicates = new ArrayList<>();

        if (status != null) {
            predicates.add(builder.equal(request.get("status"), status));
        }
        if (requestedFrom != null) {
            predicates.add(builder.greaterThanOrEqualTo(
                    request.get("requestedAt"), requestedFrom));
        }
        if (requestedTo != null) {
            predicates.add(builder.lessThanOrEqualTo(
                    request.get("requestedAt"), requestedTo));
        }
        if (ownerKeyword != null) {
            predicates.add(builder.or(
                    ownerMatches(builder, query, request, TeacherProfile.class, "teacherId",
                            ownerKeyword),
                    ownerMatches(builder, query, request, StudentProfile.class, "studentId",
                            ownerKeyword)));
        }
        if (reconciliationStatus != null) {
            predicates.add(builder.exists(
                    reconciliationSubquery(builder, query, request, reconciliationStatus)));
        }

        return predicates.toArray(new Predicate[0]);
    }

    /**
     * EXISTS over the owner profile (teacher or student) whose display name, full
     * name or email matches the keyword. The keyword arrives already lower-cased
     * and wrapped in {@code %}.
     */
    private <T> Predicate ownerMatches(
            CriteriaBuilder builder,
            AbstractQuery<?> query,
            Root<WithdrawalRequest> request,
            Class<T> profileType,
            String ownerIdAttribute,
            String ownerKeyword
    ) {
        Subquery<UUID> subquery = query.subquery(UUID.class);
        Root<T> profile = subquery.from(profileType);
        Join<T, AppUser> user = profile.join("user", JoinType.INNER);

        subquery.select(profile.get("id")).where(
                builder.equal(profile.get("id"), request.get(ownerIdAttribute)),
                builder.or(
                        likeIgnoringNull(builder, profile.get("displayName"), ownerKeyword),
                        likeIgnoringNull(builder, user.get("fullName"), ownerKeyword),
                        likeIgnoringNull(builder, user.get("email"), ownerKeyword)));

        return builder.exists(subquery);
    }

    private Subquery<UUID> reconciliationSubquery(
            CriteriaBuilder builder,
            AbstractQuery<?> query,
            Root<WithdrawalRequest> request,
            ReconciliationStatus reconciliationStatus
    ) {
        Subquery<UUID> subquery = query.subquery(UUID.class);
        Root<PayoutSettlement> settlement = subquery.from(PayoutSettlement.class);

        subquery.select(settlement.get("id")).where(
                builder.equal(settlement.get("withdrawalRequestId"), request.get("id")),
                builder.equal(settlement.get("reconciliationStatus"), reconciliationStatus));

        return subquery;
    }

    private Predicate likeIgnoringNull(
            CriteriaBuilder builder,
            Path<String> attribute,
            String keyword
    ) {
        return builder.like(
                builder.lower(builder.coalesce(attribute, "")),
                keyword);
    }
}
