package com.manabihub.payout.repository;

import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.payout.dto.request.PayoutQueueFilterRequest;
import com.manabihub.payout.entity.PayoutSettlement;
import com.manabihub.payout.entity.WithdrawalRequest;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class PayoutQueueSpecification {

    private PayoutQueueSpecification() {
    }

    public static Specification<WithdrawalRequest> from(PayoutQueueFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getRequestedFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("requestedAt"),
                        filter.getRequestedFrom()
                ));
            }
            if (filter.getRequestedTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("requestedAt"),
                        filter.getRequestedTo()
                ));
            }

            String ownerKeyword = normalizeKeyword(filter.getTeacherKeyword());
            if (ownerKeyword != null) {
                predicates.add(criteriaBuilder.or(
                        teacherMatches(
                                root,
                                query.subquery(Integer.class),
                                criteriaBuilder,
                                ownerKeyword
                        ),
                        studentMatches(
                                root,
                                query.subquery(Integer.class),
                                criteriaBuilder,
                                ownerKeyword
                        )
                ));
            }
            if (filter.getReconciliationStatus() != null) {
                predicates.add(reconciliationMatches(
                        root,
                        query.subquery(Integer.class),
                        criteriaBuilder,
                        filter
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Predicate teacherMatches(
            Root<WithdrawalRequest> withdrawal,
            Subquery<Integer> subquery,
            CriteriaBuilder criteriaBuilder,
            String teacherKeyword
    ) {
        Root<TeacherProfile> teacher = subquery.from(TeacherProfile.class);
        subquery.select(criteriaBuilder.literal(1));
        subquery.where(
                criteriaBuilder.equal(teacher.get("id"), withdrawal.get("teacherId")),
                criteriaBuilder.or(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(criteriaBuilder.coalesce(teacher.get("displayName"), "")),
                                teacherKeyword
                        ),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(criteriaBuilder.coalesce(teacher.get("user").get("fullName"), "")),
                                teacherKeyword
                        ),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(criteriaBuilder.coalesce(teacher.get("user").get("email"), "")),
                                teacherKeyword
                        )
                )
        );
        return criteriaBuilder.exists(subquery);
    }

    private static Predicate studentMatches(
            Root<WithdrawalRequest> withdrawal,
            Subquery<Integer> subquery,
            CriteriaBuilder criteriaBuilder,
            String studentKeyword
    ) {
        Root<StudentProfile> student = subquery.from(StudentProfile.class);
        subquery.select(criteriaBuilder.literal(1));
        subquery.where(
                criteriaBuilder.equal(student.get("id"), withdrawal.get("studentId")),
                criteriaBuilder.or(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(criteriaBuilder.coalesce(student.get("displayName"), "")),
                                studentKeyword
                        ),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(criteriaBuilder.coalesce(student.get("user").get("fullName"), "")),
                                studentKeyword
                        ),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(criteriaBuilder.coalesce(student.get("user").get("email"), "")),
                                studentKeyword
                        )
                )
        );
        return criteriaBuilder.exists(subquery);
    }

    private static Predicate reconciliationMatches(
            Root<WithdrawalRequest> withdrawal,
            Subquery<Integer> subquery,
            CriteriaBuilder criteriaBuilder,
            PayoutQueueFilterRequest filter
    ) {
        Root<PayoutSettlement> settlement = subquery.from(PayoutSettlement.class);
        subquery.select(criteriaBuilder.literal(1));
        subquery.where(
                criteriaBuilder.equal(
                        settlement.get("withdrawalRequestId"),
                        withdrawal.get("id")
                ),
                criteriaBuilder.equal(
                        settlement.get("reconciliationStatus"),
                        filter.getReconciliationStatus()
                )
        );
        return criteriaBuilder.exists(subquery);
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return "%" + keyword.trim().toLowerCase() + "%";
    }
}
