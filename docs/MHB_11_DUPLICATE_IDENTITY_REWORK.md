# MHB-11 Rework: Preventing Duplicate CCCD Across Teachers

## Overview
This document describes the architectural changes implemented in **MHB-11 Rework** to prevent a single Citizen Identity Card (CCCD) from being registered or reused across multiple teacher accounts in ManabiHub.

---

## Technical Design & Key Features

### 1. Database Schema (`teacher_identity_claims`)
- Migration script: `V023__create_teacher_identity_claims_table.sql`
- Table definition:
  ```sql
  CREATE TABLE teacher_identity_claims (
      teacher_id UUID PRIMARY KEY REFERENCES teacher_profiles(id) ON DELETE CASCADE,
      identity_fingerprint VARCHAR(64) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_teacher_identity_claims_fingerprint ON teacher_identity_claims(identity_fingerprint);
  ```
- Hard database-level `UNIQUE (identity_fingerprint)` constraint ensures zero race conditions during concurrent submissions.

### 2. CCCD Normalization & HMAC-SHA-256 Fingerprinting
- **Normalization**: All non-digit characters (`\D`) are stripped (removing spaces, hyphens, and delimiters). Exactly 12 digits are required.
- **Fingerprinting**: Calculated using `HMAC-SHA-256` with environment secret `manabihub.kyc.identity-secret`.
- **Zero Raw CCCD Storage**: Raw CCCD numbers and HMAC fingerprints are never logged, returned in API payloads, or saved into `audit_logs`.

### 3. Idempotency & Duplicate Protection Workflow
- **Same Teacher Retry**: Retrying identity verification with the same CCCD updates the timestamp idempotently.
- **Different Teacher Duplicate**: Attemping to claim a CCCD already registered by another teacher throws `BusinessException` with `HttpStatus.CONFLICT` (409) and error code `MSG-KYC-008`.
- **State Machine Guarantee**: Duplicate identity attempts block execution BEFORE certificate approval, granting `TEACHER` role, or setting `canPublishCourse=true`.

### 4. Security Audit (`REQUIRES_NEW`)
- When duplicate identity attempt is detected, `SecurityAuditService.logDuplicateIdentityAudit(...)` executes with `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
- Guarantees the security audit log (`KYC_DUPLICATE_IDENTITY_DETECTED`) is saved to PostgreSQL even when the outer KYC transaction is rolled back by the 409 exception.

### 5. Automated Historical Backfill
- `TeacherIdentityClaimBackfillRunner` executes on application startup (`ApplicationReadyEvent`).
- Scans historical `kyc_requests` with `VERIFIED` status, extracts OCR `idNumber`, normalizes, hashes, and populates `teacher_identity_claims` for pre-existing teacher profiles.

---

## Test Verification

| Test Case | Class | Status |
|-----------|-------|--------|
| Teacher B using Teacher A's CCCD returns HTTP 409 + `MSG-KYC-008` | `TeacherIdentityClaimDuplicateIntegrationTest` | PASSED |
| Spaces/hyphens normalization (`"012 345 678 901"`) detected as duplicate | `TeacherIdentityClaimServiceTest` | PASSED |
| Teacher A retry with same CCCD succeeds idempotently | `TeacherIdentityClaimDuplicateIntegrationTest` | PASSED |
| Profile status not changed to APPROVED & role not granted on duplicate | `TeacherIdentityClaimDuplicateIntegrationTest` | PASSED |
| Security audit log persisted after transaction rollback (`REQUIRES_NEW`) | `TeacherIdentityClaimDuplicateIntegrationTest` | PASSED |
| Controller returns HTTP 409 + `MSG-KYC-008` | `TeacherKycControllerSecurityTest` | PASSED |
| Spring context and backfill startup validation | `ManabiHubApplicationTests` | PASSED |
