# Database Schema Ownership

## Goal
The purpose of this document is to clarify physical table ownership by JPA entities, ensuring a clean and single source of truth for each table. We eliminate the anti-pattern of multiple entities mapped to the same physical table, avoiding conflicts, optimistic locking errors, and unexpected Hibernate behaviors.

## Inventory & Current State

As of the MHB-71 schema rework, all physical table mappings have been strictly reviewed and aligned with the **One Table, One Entity** rule.

### `app_users` Table
- **Writable Owner**: `com.manabihub.identity.entity.AppUser` (or `identity.entity.AppUser`). This entity serves as the single system-of-record for user authentication, basic profile, and base identity state.
- **Compatibility Mapping**: `com.manabihub.kyc.domain.AppUser` (in the KYC domain) acts as an immutable compatibility mapping. It MUST NOT modify the table data.
- **Legacy State**: Previously shared with a redundant `User` entity, which has been removed/merged.

### `wallets` Table
- **Writable Owner**: `com.manabihub.wallet.entity.Wallet`.
- **Legacy State**: Previously, this physical table was shared between `TeacherWallet` and `StudentWallet` entities. Now, the unified `Wallet` entity supports `ownerType` (`STUDENT`, `TEACHER`, `PLATFORM`) and handles all balances, eliminating duplicate persistence flows. `TeacherWallet` and `StudentWallet` have been removed.

### `internal_admin_accounts` Table
- **Writable Owner**: `com.manabihub.identity.entity.InternalAdminAccount`.
- **Compatibility Mapping**: Immutable compatibility mapping where required for cross-domain references, without write privileges.

## Guidelines

1. **One Table, One Entity**: No two root JPA entities (`@Entity`) should map to the same physical `@Table(name = "x")` with write privileges. If you need subsets of columns for optimization, consider Projections, DTOs, or strictly read-only views (`@Immutable`) instead of mapping a duplicate writable entity.
2. **Flyway Synchronization**: Any change to JPA entity structures must have a corresponding Flyway migration script in `V...__name.sql`. The entity state must exactly mirror the database state defined by the migrations.
3. **Collision Repair**: Checksum collisions in Flyway (such as `V031`) are managed by specific repair scripts or out-of-band updates, but no existing versioned migration should be modified after it is committed.

## Upgrade Path

When refactoring multiple entities sharing a table into a single entity:
1. Identify the primary owner (usually the one with more relationships or deeper business logic).
2. Refactor services that used the secondary entity to use the primary owner entity.
3. Remove the secondary entity.
4. Ensure Flyway schema covers any new columns required by the consolidation.
5. Create an integration test (e.g. `FlywayMigrationIntegrationTest`) to verify that the schema applies correctly.
