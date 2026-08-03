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
        UUID enrollmentId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        UUID paymentTxId = UUID.randomUUID();
        UUID auditLogId = UUID.randomUUID();
        UUID lessonProgressId = UUID.randomUUID();

        legacyJdbc.update("INSERT INTO legacy_test.app_users (id, email, full_name, created_at, updated_at) VALUES (?, 's1@test.com', 'S1', now(), now())", studentUserId);
        legacyJdbc.update("INSERT INTO legacy_test.app_users (id, email, full_name, created_at, updated_at) VALUES (?, 't1@test.com', 'T1', now(), now())", teacherUserId);
        legacyJdbc.update("INSERT INTO legacy_test.student_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, now(), now())", studentProfileId, studentUserId);
        legacyJdbc.update("INSERT INTO legacy_test.teacher_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, now(), now())", teacherProfileId, teacherUserId);

        legacyJdbc.update("INSERT INTO legacy_test.courses (id, teacher_id, title, description, slug, status, created_at, updated_at) VALUES (?, ?, 'T', 'D', 'slug3', 'DRAFT', now(), now())", courseId, teacherProfileId);
        legacyJdbc.update("INSERT INTO legacy_test.course_modules (id, course_id, title, order_index, created_at, updated_at) VALUES (?, ?, 'M', 1, now(), now())", moduleId, courseId);
        legacyJdbc.update("INSERT INTO legacy_test.lessons (id, module_id, title, content, order_index, created_at, updated_at) VALUES (?, ?, 'L', 'C', 1, now(), now())", lessonId, moduleId);
        legacyJdbc.update("INSERT INTO legacy_test.lesson_blocks (id, lesson_id, title, content, block_type, order_index, created_at, updated_at) VALUES (?, ?, 'B', 'C', 'TEXT', 1, now(), now())", lessonBlockId, lessonId);

        legacyJdbc.update("INSERT INTO legacy_test.enrollments (id, course_id, student_id, enrollment_status, created_at, updated_at) VALUES (?, ?, ?, 'ACTIVE', now(), now())", enrollmentId, courseId, studentProfileId);

        legacyJdbc.update("INSERT INTO legacy_test.lesson_progress (id, enrollment_id, lesson_id, status, created_at, updated_at) VALUES (?, ?, ?, 'COMPLETED', now(), now())", lessonProgressId, enrollmentId, lessonId);

        // V031 has idempotency logic
        legacyJdbc.update("INSERT INTO legacy_test.wallets (id, owner_type, teacher_id, balance, frozen_balance, currency, created_at) VALUES (?, 'TEACHER', ?, 500, 0, 'VND', now())", walletId, teacherProfileId);
        legacyJdbc.update("INSERT INTO legacy_test.payment_transactions (id, wallet_id, amount, currency, transaction_type, status, reference_id, idempotency_key, created_at) VALUES (?, ?, 100, 'VND', 'DEPOSIT', 'COMPLETED', 'ref1', 'idem1', now())", paymentTxId, walletId);

        legacyJdbc.update("INSERT INTO legacy_test.audit_logs (id, entity_name, entity_id, action, changed_by, changes, created_at) VALUES (?, 'Course', ?, 'CREATE', 'system', '{}', now())", auditLogId, courseId.toString());

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

        Integer wCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.wallets WHERE id = ?", Integer.class, walletId);
        assertThat(wCount).isEqualTo(1);

        Integer ptCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.payment_transactions WHERE id = ?", Integer.class, paymentTxId);
        assertThat(ptCount).isEqualTo(1);

        Integer alCount = legacyJdbc.queryForObject("SELECT count(*) FROM legacy_test.audit_logs WHERE id = ?", Integer.class, auditLogId);
        assertThat(alCount).isEqualTo(1);
    }

    private void verifyDatabaseConstraints() {
        Integer fkCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public' AND constraint_name = 'fk_wallets_teacher'", Integer.class);
        assertThat(fkCount).isEqualTo(1);

        Integer uniqueCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'UNIQUE' AND table_schema = 'public' AND constraint_name = 'uk_payment_transactions_idempotency'", Integer.class);
        assertThat(uniqueCount).isEqualTo(1);
    }
}
