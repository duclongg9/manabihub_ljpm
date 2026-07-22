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

### D. Historical Backfill with Pagination & Quarantine Policy
- **Deterministic Pagination**:
  - `TeacherIdentityClaimBackfillRunner` queries `kyc_requests` in pages of 100 ordered by `createdAt ASC`.
- **Quarantine / Fail-Closed on Historical Conflicts**:
  - If multiple historical teacher profiles share the exact same CCCD fingerprint in legacy data, the backfill **DOES NOT** select one profile arbitrarily.
  - Both/all conflicting teacher profiles are quarantined (no claim record inserted), and a security audit event (`KYC_BACKFILL_DUPLICATE_QUARANTINED`) is logged requiring manual administrative resolution.

### E. Explicit Database Constraints & Exception Mapping
- **Database Migration (`V023`)**:
  - `teacher_identity_claims` table created with explicit constraint name:
    `CONSTRAINT uk_teacher_identity_claims_fingerprint UNIQUE (identity_fingerprint)`.
  - Redundant index creation removed since PostgreSQL automatically creates an index for `UNIQUE` constraints.
- **Precise Exception Handling**:
  - `TeacherIdentityClaimService` inspects `DataIntegrityViolationException` root cause.
  - ONLY violations matching `uk_teacher_identity_claims_fingerprint` trigger `logDuplicateIdentityAudit` and throw `BusinessException(MessageCodes.MSG_KYC_008, ..., HttpStatus.CONFLICT)`.
  - Any other database errors (e.g., foreign key or NOT NULL violations) are rethrown.

---

## 3. Verification & Test Evidence

- **Unit & Integration Test Suite**:
  - `TeacherIdentityClaimServiceUnitTest`: Unit testing for normalization, secret validation, HMAC generation, and exception mapping.
  - `TeacherIdentityClaimDuplicatePostgresIntegrationTest`: Integration test executing Spring context, database transactions, concurrent claim protection, `REQUIRES_NEW` audit log persistence, state protection, and historical backfill quarantine.
  - **Total Tests Passed**: **95 / 95** (`./mvnw test`).
- **Flyway & Hibernate Validation**: `ddl-auto: validate` and Flyway `V023` migration verified clean.
- **Git Check**: `git diff --check` executed with 0 errors.
