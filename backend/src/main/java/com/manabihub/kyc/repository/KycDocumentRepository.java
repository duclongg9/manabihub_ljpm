package com.manabihub.kyc.repository;

import com.manabihub.kyc.domain.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface KycDocumentRepository extends JpaRepository<KycDocument, UUID> {

    List<KycDocument> findByKycRequestIdOrderByCreatedAtAsc(UUID kycRequestId);

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM kyc_documents kd
            JOIN kyc_requests kr ON kr.id = kd.kyc_request_id
            WHERE kd.document_type IN ('ID_CARD_FRONT', 'ID_CARD_BACK')
              AND kd.file_hash = :fileHash
              AND kr.teacher_id <> :teacherId
        )
        """, nativeQuery = true)
    boolean existsIdentityHashForOtherTeacher(@Param("fileHash") String fileHash, @Param("teacherId") UUID teacherId);
}
