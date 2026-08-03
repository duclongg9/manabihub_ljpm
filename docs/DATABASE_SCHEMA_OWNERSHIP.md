# Database Schema Ownership

## Goal
The purpose of this document is to clarify physical table ownership by JPA entities, ensuring a clean and single source of truth for each table. We eliminate the anti-pattern of multiple entities mapped to the same physical table, avoiding conflicts, optimistic locking errors, and unexpected Hibernate behaviors.

## Physical Table Inventory (V002 – V053)

| Table | Creation/Latest Migration | Writable Owner / DB-only | Compatibility Mapping | Active/Legacy State |
|---|---|---|---|---|
| `app_users` | V002 / V053 | `com.manabihub.identity.entity.AppUser` | `com.manabihub.kyc.domain.AppUser` (`@Immutable`) | Active |
| `internal_admin_accounts` | V005 / V053 | `com.manabihub.identity.entity.InternalAdminAccount` | `com.manabihub.kyc.domain.InternalAdminAccount` (`@Immutable`) | Active |
| `wallets` | V031 / V052 | `com.manabihub.wallet.entity.Wallet` | N/A | Active |
| `payment_transactions` | V031 / V053 | `com.manabihub.wallet.entity.PaymentTransaction` | N/A | Active |
| `lessons` | V010 / V031 | DB-only | N/A | Legacy |
| `lesson_blocks` | V010 / V031 | DB-only | N/A | Legacy |
| `lesson_progress` | V020 / V031 | DB-only | N/A | Legacy (Read-only fallback) |
| `course_lesson_blocks` | V040 / V053 | `com.manabihub.course.entity.LessonBlock` | N/A | Active |
| `lesson_block_progress` | V040 / V053 | `com.manabihub.learning.entity.LessonBlockProgress` | N/A | Active |
| `final_tests` | V045 / V053 | `com.manabihub.finaltest.entity.FinalTest` | N/A | Active |

## Guidelines

1. **One Table, One Entity**: No two root JPA entities (`@Entity`) should map to the same physical `@Table(name = "x")` with write privileges. If you need subsets of columns for optimization, consider Projections, DTOs, or strictly read-only views (`@Immutable`) instead of mapping a duplicate writable entity.
2. **Compatibility Mapping**: When a domain needs to read a table owned by another domain, use an `@Immutable` entity to prevent accidental writes (e.g., `com.manabihub.kyc.domain.InternalAdminAccount`).
3. **Retirement Policy**: Legacy tables like `lessons`, `lesson_blocks`, and `lesson_progress` do not have an active JPA writable owner. They are retained for historical queries only. Do not create synthetic JPA classes for them to perform writes.
4. **Flyway Synchronization**: Any change to JPA entity structures must have a corresponding Flyway migration script in `V...__name.sql`. The entity state must exactly mirror the database state defined by the migrations.

## Migration History and Upgrade Path

- **V031 Canonical**: `V031__add_payment_transaction_idempotency.sql` was historically the base schema establishing wallet idempotency and transaction boundaries. This is the canonical V031.
- **V051 - V053 Upgrade History**: Migrations applied forward-only schema changes (e.g. `wallet_topups` was renumbered to V052 after a branch collision, ensuring monotonic, conflict-free upgrades).
- **V054**: Placeholder migrations attempting to "fake" data backfills (like `SELECT 1`) were removed. If backfills cannot be done safely, the legacy data remains untouched and follows the retirement policy above. No fake migrations are allowed.
