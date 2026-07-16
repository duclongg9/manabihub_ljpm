package com.manabihub.learning.repository;

import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    int countByStudentId(UUID studentId);
    int countByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);
    Page<Enrollment> findByStudentId(UUID studentId, Pageable pageable);
}
