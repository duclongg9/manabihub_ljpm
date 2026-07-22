# MHB-11 Rework: Preventing Duplicate Identity Claims Across Teachers

## 1. Overview & Business Objectives
MHB-11 Rework prevents the exact same National ID (CCCD) from being claimed or reused across multiple teacher accounts in ManabiHub.

---

## 2. Technical Architecture & Design Decisions

### A. Secret Key Management & Fail-Fast
- **Configuration**:
  - Base `application.yml`: `manabihub.kyc.identity-secret: ${KYC_IDENTITY_SECRET:}` (No fallback default key stored in repository code).
  - Dev/Local environment (`application-local.yml` / `application-test.yml`): Pre-configured local-only secret key (`local-dev-only-identity-secret-key-32chars`).
- **Production Validation (Fail-Fast)**:
  - On application startup (`InitializingBean.afterPropertiesSet`), `TeacherIdentityClaimService` validates `KYC_IDENTITY_SECRET`.
  - If missing, blank, or shorter than 32 characters, initialization fails fast with `IllegalStateException`.
- **Key Stability & Rotation Requirement**:
  - The secret key **MUST BE STABLE** across application restarts and deployments. Changing the secret key alters all derived HMAC-SHA-256 fingerprints, effectively invalidating stored claims.
  - Secret key rotation requires a key-versioning or database re-hashing migration strategy.

### B. CCCD Normalization & Registry Verification Timing
- **Normalization Timing**:
  - When raw identity data is received from eKYC/VNPT SDK, `normalizeCccd(rawIdNumber)` is executed **BEFORE** querying the National ID Registry and before processing identity claims.
  - Non-digit characters (`\D`) are removed, and a 12-digit format check is strictly enforced.
- **Clean Registry Input**:
  - `nationalIdRegistryPort.findActiveByIdNumber(normalizedCccd)` always receives a clean 12-digit string (e.g., `"012345678901"`).

### C. PII Boundary & API Response Protection
- **Teacher-Facing API Boundary (`KycRequestResponse`)**:
  - `providerResult` is stripped completely.
  - `identityOcr.idNumber` is redacted (e.g., `"0123******01"`).
- **Audit & Logging Boundaries**:
  - **Zero Raw CCCD or Fingerprint Logging**: SLF4J logs, application stdout, and security audit logs (`audit_logs`) NEVER store or log raw CCCD numbers or HMAC fingerprints.
  - Internal storage: Raw `verificationPayload` is retained within restricted `kyc_requests` internal database tables strictly for admin compliance auditing.

### D. Historical Backfill with Pagination & Strict Fail-Closed Quarantine Policy
- **Deterministic Pagination**:
  - `TeacherIdentityClaimBackfillRunner` queries `kyc_requests` in pages of 100 ordered by `createdAt ASC`.
- **Quarantine / Fail-Closed on Historical Conflicts**:
  - If multiple historical teacher profiles share the exact same CCCD fingerprint in legacy data, the backfill **DOES NOT** select one profile arbitrarily.
  - Both/all conflicting teacher profiles are quarantined fail-closed: course publishing rights are revoked (`canPublishCourse = false`) and status is set to `kycStatus = REJECTED` so they cannot publish courses or retain verified capabilities until manual admin resolution.
  - A security audit event (`KYC_BACKFILL_DUPLICATE_QUARANTINED`) is logged for each quarantined teacher profile.

### E. Explicit Database Constraints & Exception Mapping
- **Database Migration (`V023`)**:
  - `teacher_identity_claims` table created with explicit constraint name:
    `CONSTRAINT uk_teacher_identity_claims_fingerprint UNIQUE (identity_fingerprint)`.
- **Precise Structured Exception Handling**:
  - `TeacherIdentityClaimService` inspects structured `ConstraintViolationException.getConstraintName()` and `SQLException.getSQLState()` (`23505`) metadata.
  - ONLY constraint violations matching the exact constraint name `uk_teacher_identity_claims_fingerprint` trigger `logDuplicateIdentityAudit` and throw `BusinessException(MessageCodes.MSG_KYC_008, ..., HttpStatus.CONFLICT)`.
  - Any other database errors (e.g., foreign key or NOT NULL violations) are rethrown.

---

## 3. Verification & Test Evidence

- **Real PostgreSQL 17 Integration Test Execution**:
  - `TeacherIdentityClaimDuplicatePostgresIntegrationTest`: Executed against REAL PostgreSQL 17 cluster (`jdbc:postgresql://127.0.0.1:5439/manabihub_test`).
  - Flyway migrations `V001` through `V023` executed successfully on PostgreSQL 17.
  - Hibernate schema validation (`hibernate.ddl-auto: validate`) verified clean against PostgreSQL schema.
- **Unit & Integration Test Suite**:
  - `TeacherIdentityClaimServiceUnitTest`: Verified secret fail-fast validation, CCCD normalization, HMAC fingerprinting, and structured exception matching.
  - `TeacherIdentityClaimDuplicatePostgresIntegrationTest`: Verified end-to-end duplicate protection, idempotent re-verification for the same teacher, HTTP 409 + MSG-KYC-008 for different teachers, `REQUIRES_NEW` audit log persistence across transaction rollbacks, PII redaction, and fail-closed historical duplicate quarantine.
  - **Total Tests Passed**: **95 / 95** (`./mvnw test`).
- **Whitespace & Formatting Verification**: `git diff --check origin/develop...HEAD` executed with 0 errors.
