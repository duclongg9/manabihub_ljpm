package com.manabihub;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@org.springframework.boot.test.context.SpringBootTest(webEnvironment = org.springframework.boot.test.context.SpringBootTest.WebEnvironment.NONE)
@AutoConfigureTestDatabase(replace = NONE)
@Testcontainers
@ActiveProfiles("it")
public class FlywayMigrationIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("manabihub_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "25");
        registry.add("manabihub.kyc.identity-secret", () -> "test-only-identity-secret-at-least-32-bytes");
        registry.add("manabihub.payout.security-secret", () -> "test-only-payout-security-secret-at-least-32-bytes");
    }

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    // ── Test 1: Clean build from V001 to V053 ──────────────────────────────
    @Test
    void cleanMigrationToLatestVersion() {
        assertThat(flyway).isNotNull();

        MigrationInfo[] all = flyway.info().all();
        assertThat(all).isNotEmpty();

        // No failed or pending migrations
        List<MigrationInfo> bad = Arrays.stream(all)
                .filter(i -> i.getState() == MigrationState.FAILED
                        || i.getState() == MigrationState.PENDING)
                .collect(Collectors.toList());
        assertThat(bad).as("No failed or pending migrations").isEmpty();

        // Exact latest version
        String current = flyway.info().current().getVersion().toString();
        assertThat(current).isEqualTo("055");

        // Hibernate ddl-auto=validate already succeeded if context loaded
        verifyConstraintsAndIndexes();
    }

    // ── Test 2: V031 → V055 upgrade preserves representative data ──────────
    @Test
    void upgradeFromV031PreservesData() {
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS upgrade_test");

        // Migrate to V031 in a separate schema
        Flyway v031 = Flyway.configure()
                .dataSource(dataSource)
                .schemas("upgrade_test")
                .target("031")
                .load();
        v031.migrate();

        // ── Seed representative data ────────────────────────────────────────
        JdbcTemplate lj = new JdbcTemplate(dataSource);
        String s = "upgrade_test"; // schema qualifier

        UUID studentUserId  = UUID.randomUUID();
        UUID teacherUserId  = UUID.randomUUID();
        UUID studentProfId  = UUID.randomUUID();
        UUID teacherProfId  = UUID.randomUUID();
        UUID courseId        = UUID.randomUUID();
        UUID moduleId        = UUID.randomUUID();
        UUID lessonId        = UUID.randomUUID();
        UUID lessonBlockId   = UUID.randomUUID();
        UUID clbId           = UUID.randomUUID();
        UUID enrollmentId    = UUID.randomUUID();
        UUID lessonProgId    = UUID.randomUUID();
        UUID lbpId           = UUID.randomUUID();
        UUID walletId        = UUID.randomUUID();
        UUID orderId         = UUID.randomUUID();
        UUID paymentTxId     = UUID.randomUUID();
        UUID auditLogId      = UUID.randomUUID();

        // Users & profiles
        lj.update("INSERT INTO " + s + ".app_users (id, email, full_name, created_at) VALUES (?, 'su@test.com', 'SU', now())", studentUserId);
        lj.update("INSERT INTO " + s + ".app_users (id, email, full_name, created_at) VALUES (?, 'tu@test.com', 'TU', now())", teacherUserId);
        lj.update("INSERT INTO " + s + ".student_profiles (id, user_id, created_at) VALUES (?, ?, now())", studentProfId, studentUserId);
        lj.update("INSERT INTO " + s + ".teacher_profiles (id, user_id, created_at) VALUES (?, ?, now())", teacherProfId, teacherUserId);

        // Course -> module -> legacy lesson -> legacy lesson_block
        lj.update("INSERT INTO " + s + ".courses (id, teacher_id, title, description, slug, status, created_at) VALUES (?, ?, 'C', 'D', 'slug-upgrade', 'DRAFT', now())", courseId, teacherProfId);
        lj.update("INSERT INTO " + s + ".course_modules (id, course_id, title, order_index, created_at) VALUES (?, ?, 'M', 1, now())", moduleId, courseId);
        lj.update("INSERT INTO " + s + ".lessons (id, module_id, title, lesson_type, order_index, created_at) VALUES (?, ?, 'L', 'VIDEO', 1, now())", lessonId, moduleId);
        lj.update("INSERT INTO " + s + ".lesson_blocks (id, lesson_id, block_type, content, order_index, created_at) VALUES (?, ?, 'TEXT', '{\"text\":\"hello\"}'::jsonb, 1, now())", lessonBlockId, lessonId);

        // course_lesson_blocks (V018 table, exists by V031)
        lj.update("INSERT INTO " + s + ".course_lesson_blocks (id, module_id, block_type, title, order_index, created_at) VALUES (?, ?, 'TEXT', 'CLB', 1, now())", clbId, moduleId);

        // Enrollment (enrolled_at, no created_at/updated_at)
        lj.update("INSERT INTO " + s + ".enrollments (id, student_id, course_id, enrollment_status, enrolled_at) VALUES (?, ?, ?, 'ACTIVE', now())", enrollmentId, studentProfId, courseId);

        // lesson_progress
        lj.update("INSERT INTO " + s + ".lesson_progress (id, enrollment_id, lesson_id, status, created_at) VALUES (?, ?, ?, 'COMPLETED', now())", lessonProgId, enrollmentId, lessonId);

        // lesson_block_progress (V024 table, column is lesson_block_id)
        lj.update("INSERT INTO " + s + ".lesson_block_progress (id, enrollment_id, lesson_block_id, status, created_at, updated_at) VALUES (?, ?, ?, 'COMPLETED', now(), now())", lbpId, enrollmentId, clbId);

        // Wallet
        lj.update("INSERT INTO " + s + ".wallets (id, owner_type, teacher_id, balance, frozen_balance, currency, created_at) VALUES (?, 'TEACHER', ?, 500, 0, 'VND', now())", walletId, teacherProfId);

        // Order (order_code required, order_status, use PAID)
        lj.update("INSERT INTO " + s + ".orders (id, student_id, order_code, total_amount, currency, order_status, created_at) VALUES (?, ?, 'ORD-001', 100, 'VND', 'PAID', now())", orderId, studentProfId);

        // Payment transaction (provider, amount, status=SUCCESS)
        lj.update("INSERT INTO " + s + ".payment_transactions (id, order_id, provider, provider_transaction_id, amount, status, created_at) VALUES (?, ?, 'VNPAY', 'txn_123', 100, 'SUCCESS', now())", paymentTxId, orderId);

        // Audit log (target_id is UUID, actor_type SYSTEM)
        lj.update("INSERT INTO " + s + ".audit_logs (id, actor_type, action, target_type, target_id, before_value, after_value, metadata, created_at) VALUES (?, 'SYSTEM', 'CREATE', 'COURSE', ?, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now())", auditLogId, courseId);

        // ── Upgrade to latest ───────────────────────────────────────────────
        Flyway latest = Flyway.configure()
                .dataSource(dataSource)
                .schemas("upgrade_test")
                .load();
        latest.migrate();

        // ── Assert every seeded row survived ────────────────────────────────
        assertRowExists(lj, s, "enrollments", enrollmentId);
        assertRowExists(lj, s, "lesson_progress", lessonProgId);
        assertRowExists(lj, s, "course_lesson_blocks", clbId);
        assertRowExists(lj, s, "lesson_block_progress", lbpId);
        assertRowExists(lj, s, "wallets", walletId);
        assertRowExists(lj, s, "payment_transactions", paymentTxId);
        assertRowExists(lj, s, "audit_logs", auditLogId);

        // Verify wallet balance preserved
        Integer balance = lj.queryForObject(
                "SELECT balance FROM " + s + ".wallets WHERE id = ?", Integer.class, walletId);
        assertThat(balance).isEqualTo(500);

        // Verify payment idempotency key preserved
        String provTxn = lj.queryForObject(
                "SELECT provider_transaction_id FROM " + s + ".payment_transactions WHERE id = ?",
                String.class, paymentTxId);
        assertThat(provTxn).isEqualTo("txn_123");
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private void assertRowExists(JdbcTemplate jt, String schema, String table, UUID id) {
        Integer count = jt.queryForObject(
                "SELECT count(*) FROM " + schema + "." + table + " WHERE id = ?",
                Integer.class, id);
        assertThat(count).as(table + " row " + id + " preserved").isEqualTo(1);
    }

    private void verifyConstraintsAndIndexes() {
        // chk_wallets_owner_type (CHECK constraint from V002)
        Integer chk = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints "
                        + "WHERE constraint_name = 'chk_wallets_owner_type' AND table_schema = 'public'",
                Integer.class);
        assertThat(chk).as("chk_wallets_owner_type exists").isEqualTo(1);

        // uq_lesson_block_progress_enrollment_block (UNIQUE constraint from V024)
        Integer uqLbp = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints "
                        + "WHERE constraint_name = 'uq_lesson_block_progress_enrollment_block' "
                        + "AND table_schema = 'public'",
                Integer.class);
        assertThat(uqLbp).as("uq_lesson_block_progress_enrollment_block exists").isEqualTo(1);

        // uq_payment_transactions_provider_txn (partial unique index from V031)
        Integer uqPt = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM pg_indexes "
                        + "WHERE indexname = 'uq_payment_transactions_provider_txn' "
                        + "AND schemaname = 'public'",
                Integer.class);
        assertThat(uqPt).as("uq_payment_transactions_provider_txn exists").isEqualTo(1);
        // wallet_payment_reservations table
        Integer tblWpr = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_name = 'wallet_payment_reservations' AND table_schema = 'public'",
                Integer.class);
        assertThat(tblWpr).as("wallet_payment_reservations exists").isEqualTo(1);

        // uq_wallet_transactions_idempotency_key constraint
        Integer uqWti = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE indexname = 'uq_wallet_transactions_idempotency_key' AND schemaname = 'public'",
                Integer.class);
        if (uqWti == 0) {
            uqWti = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_name = 'uq_wallet_transactions_idempotency_key' AND table_schema = 'public'",
                    Integer.class);
        }
        assertThat(uqWti).as("uq_wallet_transactions_idempotency_key exists").isEqualTo(1);

        // uq_refund_request_active_order constraint
        Integer uqRro = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE indexname = 'uq_refund_request_active_order' AND schemaname = 'public'",
                Integer.class);
        if (uqRro == 0) {
            uqRro = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_name = 'uq_refund_request_active_order' AND table_schema = 'public'",
                    Integer.class);
        }
        assertThat(uqRro).as("uq_refund_request_active_order exists").isEqualTo(1);

        // enrollments.protected_materials_fully_downloaded_at column
        Integer colEpm = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'protected_materials_fully_downloaded_at' AND table_schema = 'public'",
                Integer.class);
        assertThat(colEpm).as("enrollments.protected_materials_fully_downloaded_at exists").isEqualTo(1);
    }
}
