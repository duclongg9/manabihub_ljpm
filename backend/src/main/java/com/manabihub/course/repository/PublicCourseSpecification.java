package com.manabihub.course.repository;

import com.manabihub.course.entity.Course;
import com.manabihub.course.enums.CourseStatus;
import com.manabihub.course.enums.JlptLevel;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification builder for public course catalog search.
 * <p>
 * The {@code PUBLISHED} status filter is always applied to ensure
 * unpublished courses never leak through the public API, regardless
 * of what the frontend sends.
 */
public final class PublicCourseSpecification {

    private PublicCourseSpecification() {
        // Utility class
    }

    public static Specification<Course> buildSearch(
            String keyword,
            String category,
            JlptLevel jlptLevel,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double rating
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter PUBLISHED courses only
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED));

            // Keyword search: title OR description (case-insensitive)
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descriptionMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descriptionMatch));
            }

            // Category filter (matches Course.category string field)
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("category"), category.trim()));
            }

            // JLPT Level filter
            if (jlptLevel != null) {
                predicates.add(cb.equal(root.get("jlptLevel"), jlptLevel));
            }

            // Price range filters
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            // Rating filter
            if (rating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("averageRating"), BigDecimal.valueOf(rating)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
