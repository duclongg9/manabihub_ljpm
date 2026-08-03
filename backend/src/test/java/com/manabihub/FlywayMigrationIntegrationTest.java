package com.manabihub;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
import java.util.stream.Collectors;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
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
        registry.add("manabihub.kyc.identity-secret", () -> "this-is-a-very-long-and-secure-secret-for-testing-only-12345");
    }

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @Test
    void testFlywayMigrationsApplySuccessfully() {
        assertThat(flyway).isNotNull();

        MigrationInfo[] migrationInfos = flyway.info().all();
        assertThat(migrationInfos).isNotEmpty();

        List<MigrationInfo> failedOrPending = Arrays.stream(migrationInfos)
                .filter(info -> info.getState() == MigrationState.FAILED || info.getState() == MigrationState.PENDING)
                .collect(Collectors.toList());
        assertThat(failedOrPending).isEmpty();

        String latestVersion = flyway.info().current().getVersion().toString();
        assertThat(latestVersion).isEqualTo("053");

        verifyDatabaseConstraints();
    }

    @Test
    void testDataPreservationDuringUpgrade() {
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS legacy_test");

        Flyway legacyFlyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas("legacy_test")
                .target("031")
                .load();

        legacyFlyway.migrate();

        JdbcTemplate legacyJdbc = new JdbcTemplate(dataSource);

        UUID studentUserId = UUID.randomUUID();
        UUID teacherUserId = UUID.randomUUID();
        UUID studentProfileId = UUID.randomUUID();
        UUID teacherProfileId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();
        UUID lessonId = UUID.randomUUID();
        UUID lessonBlockId = UUID.randomUUID();
        UUID courseLessonBlockId = UUID.randomUUID();
        UUID enrollmentId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID paymentTxId = UUID.randomUUID();
        UUID auditLogId = UUID.randomUUID();
        UUID lessonProgressId = UUID.randomUUID();
        UUID lessonBlockProgressId = UUID.randomUUID();

        // 1. Users & Profiles
        legacyJdbc.update("INSERT INTO legacy_test.app_users (id, email, full_name, created_at, updated_at) VALUES (?, 's1@test.com', 'S1', now(), now())", studentUserId);
        legacyJdbc.update("INSERT INTO legacy_test.app_users (id, email, full_name, created_at, updated_at) VALUES (?, 't1@test.com', 'T1', now(), now())", teacherUserId);
        legacyJdbc.update("INSERT INTO legacy_test.student_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, now(), now())", studentProfileId, studentUserId);
        legacyJdbc.update("INSERT INTO legacy_test.teacher_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, now(), now())", teacherProfileId, teacherUserId);

        // 2. Course, Module, Lesson, LessonBlock
        legacyJdbc.update("INSERT INTO legacy_test.courses (id, teacher_id, title, description, slug, status, created_at, updated_at) VALUES (?, ?, 'T', 'D', 'slug3', 'DRAFT', now(), now())", courseId, teacherProfileId);
        legacyJdbc.update("INSERT INTO legacy_test.course_modules (id, course_id, title, order_index, created_at, updated_at) VALUES (?, ?, 'M', 1, now(), now())", moduleId, courseId);

        // lesson_type instead of content
        legacyJdbc.update("INSERT INTO legacy_test.lessons (id, module_id, title, lesson_type, order_index, created_at, updated_at) VALUES (?, ?, 'L', 'VIDEO', 1, now(), now())", lessonId, moduleId);

        // JSONB content, no title
        legacyJdbc.update("INSERT INTO legacy_test.lesson_blocks (id, lesson_id, block_type, content, order_index, created_at, updated_at) VALUES (?, ?, 'TEXT', '{\"text\": \"hello\"}'::jsonb, 1, now(), now())", lessonBlockId, lessonId);
        legacyJdbc.update("INSERT INTO legacy_test.course_lesson_blocks (id, module_id, title, block_type, order_index, created_at, updated_at) VALUES (?, ?, 'C Block', 'TEXT', 1, now(), now())", courseLessonBlockId, moduleId);

        // 3. Enrollment & Progress
        // Use enrolled_at instead of created_at/updated_at
        legacyJdbc.update("INSERT INTO legacy_test.enrollments (id, course_id, student_id, enrollment_status, enrolled_at) VALUES (?, ?, ?, 'ACTIVE', now())", enrollmentId, courseId, studentProfileId);

        legacyJdbc.update("INSERT INTO legacy_test.lesson_progress (id, enrollment_id, lesson_id, status, created_at, updated_at) VALUES (?, ?, ?, 'COMPLETED', now(), now())", lessonProgressId, enrollmentId, lessonId);
        legacyJdbc.update("INSERT INTO legacy_test.lesson_block_progress (id, enrollment_id, block_id, status, created_at, updated_at) VALUES (?, ?, ?, 'COMPLETED', now(), now())", lessonBlockProgressId, enrollmentId, courseLessonBlockId);

        // 4. Wallet, Orders, Payment Transactions
        legacyJdbc.update("INSERT INTO legacy_test.wallets (id, owner_type, teacher_id, balance, frozen_balance, currency, created_at) VALUES (?, 'TEACHER', ?, 500, 0, 'VND', now())", walletId, teacherProfileId);

        legacyJdbc.update("INSERT INTO legacy_test.orders (id, student_id, total_amount, currency, status, created_at, updated_at) VALUES (?, ?, 100, 'VND', 'COMPLETED', now(), now())", orderId, studentProfileId);

        // payment_transactions must have order_id, provider, amount, status
        legacyJdbc.update("INSERT INTO legacy_test.payment_transactions (id, order_id, provider, provider_transaction_id, amount, status, created_at, updated_at) VALUES (?, ?, 'STRIPE', 'txn_123', 100, 'COMPLETED', now(), now())", paymentTxId, orderId);

        // 5. Audit Log
        legacyJdbc.update("INSERT INTO legacy_test.audit_logs (id, actor_type, actor_id, action, target_type, target_id, before_value, after_value, metadata, created_at) VALUES (?, 'SYSTEM', NULL, 'CREATE', 'COURSE', ?, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now())", auditLogId, courseId.toString());

        Flyway latestFlyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas("legacy_test")
                .load();

        latestFlyway.migrate();

        // Assert preservation
        Integer eCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.enrollments WHERE id = ?", Integer.class, enrollmentId);
        assertThat(eCount).isEqualTo(1);

        Integer lpCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.lesson_progress WHERE id = ?", Integer.class, lessonProgressId);
        assertThat(lpCount).isEqualTo(1);

        Integer clbCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.course_lesson_blocks WHERE id = ?", Integer.class, courseLessonBlockId);
        assertThat(clbCount).isEqualTo(1);

        Integer lbpCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.lesson_block_progress WHERE id = ?", Integer.class, lessonBlockProgressId);
        assertThat(lbpCount).isEqualTo(1);

        Integer wCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.wallets WHERE id = ?", Integer.class, walletId);
        assertThat(wCount).isEqualTo(1);

        Integer ptCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.payment_transactions WHERE id = ?", Integer.class, paymentTxId);
        assertThat(ptCount).isEqualTo(1);

        Integer alCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.audit_logs WHERE id = ?", Integer.class, auditLogId);
        assertThat(alCount).isEqualTo(1);
    }

    private void verifyDatabaseConstraints() {
        Integer chkCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_name = 'chk_wallets_owner_type' AND table_schema = 'public'", Integer.class);
        assertThat(chkCount).isEqualTo(1);

        Integer uniqueConstraintCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_name = 'uq_lesson_block_progress_enrollment_block' AND table_schema = 'public'", Integer.class);
        assertThat(uniqueConstraintCount).isEqualTo(1);

        Integer uniqueIndexCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE indexname = 'uq_payment_transactions_provider_txn' AND schemaname = 'public'", Integer.class);
        assertThat(uniqueIndexCount).isEqualTo(1);
    }
}
