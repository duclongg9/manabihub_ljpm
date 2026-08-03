# Database Schema Ownership

## Goal
The purpose of this document is to clarify physical table ownership by JPA entities, ensuring a clean and single source of truth for each table. We eliminate the anti-pattern of multiple entities mapped to the same physical table, avoiding conflicts, optimistic locking errors, and unexpected Hibernate behaviors.

## Inventory & Current State

### `app_users` Table
- **Writable Owner**: `com.manabihub.identity.entity.AppUser`. This entity serves as the single system-of-record for user authentication, basic profile, and base identity state.
- **Compatibility Mapping**: `com.manabihub.kyc.domain.AppUser` acts as an immutable compatibility mapping. It MUST NOT modify the table data.
- **Legacy State**: Previously shared with a redundant `User` entity, which has been removed/merged.

### `wallets` Table
- **Writable Owner**: `com.manabihub.wallet.entity.Wallet`.
- **Legacy State**: Previously shared between `TeacherWallet` and `StudentWallet`. Now, the unified `Wallet` entity supports `ownerType` (`STUDENT`, `TEACHER`, `PLATFORM`) and handles all balances.

### `internal_admin_accounts` Table
- **Writable Owner**: `com.manabihub.identity.entity.InternalAdminAccount`.
- **Compatibility Mapping**: Immutable compatibility mapping where required for cross-domain references, without write privileges.

### Learning Tables Inventory
- **`lessons`**
  - **Writable Owner**: None (No active JPA owner).
  - **State**: DB-only legacy/retained.
  - **Retirement Policy**: Retained for historical queries. Do not create synthetic JPA classes for it.
- **`lesson_blocks`**
  - **Writable Owner**: None (No active JPA owner).
  - **State**: DB-only legacy/retained.
  - **Retirement Policy**: Retained for historical queries. Do not create synthetic JPA classes for it.
- **`lesson_progress`**
  - **Writable Owner**: `com.manabihub.learning.entity.LessonProgress`
  - **State**: Legacy.
  - **Retirement Policy**: Retained for historical reporting, but no new writes are permitted for new courses. Read-only fallback.
- **`course_lesson_blocks`**
  - **Writable Owner**: `com.manabihub.course.entity.LessonBlock`
  - **State**: Active.
- **`lesson_block_progress`**
  - **Writable Owner**: `com.manabihub.learning.entity.LessonBlockProgress`
  - **State**: Active. Replaces older progress tracking models.
- **`final_tests`**
  - **Writable Owner**: `com.manabihub.finaltest.entity.FinalTest`
  - **State**: Active. Represents the definitive test structure for a course.

## Migration History and Upgrade Path
- **V031 Canonical**: `V031__add_payment_transaction_idempotency.sql` was historically the base schema establishing wallet idempotency and transaction boundaries. This is the canonical V031.
- **V051 - V053 Upgrade History**: Migrations applied forward-only schema changes (e.g. `wallet_topups` was renumbered to V052 after a branch collision, ensuring monotonic, conflict-free upgrades).
- **V054**: Placeholder migrations attempting to "fake" data backfills (like `SELECT 1`) were removed. If backfills cannot be done safely, the legacy data remains untouched and follows the retirement policy above. No fake migrations are allowed.

## Guidelines
1. **One Table, One Entity**: No two root JPA entities (`@Entity`) should map to the same physical `@Table(name = "x")` with write privileges. If you need subsets of columns for optimization, consider Projections, DTOs, or strictly read-only views (`@Immutable`) instead of mapping a duplicate writable entity.
2. **Flyway Synchronization**: Any change to JPA entity structures must have a corresponding Flyway migration script in `V...__name.sql`. The entity state must exactly mirror the database state defined by the migrations.
