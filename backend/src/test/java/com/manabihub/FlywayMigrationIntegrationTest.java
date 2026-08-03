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
import java.util.Map;

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
    }

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @Test
    void testFlywayMigrationsApplySuccessfully() {
        // 1. Verify that migrations ran without exception and we are at the latest version
        assertThat(flyway).isNotNull();

        MigrationInfo[] migrationInfos = flyway.info().all();
        assertThat(migrationInfos).isNotEmpty();

        // 2. Ensure no failed or pending migrations
        List<MigrationInfo> failedOrPending = Arrays.stream(migrationInfos)
                .filter(info -> info.getState() == MigrationState.FAILED || info.getState() == MigrationState.PENDING)
                .collect(Collectors.toList());
        assertThat(failedOrPending).isEmpty();

        // 3. Verify Constraints and Indexes via Information Schema
        verifyDatabaseConstraints();
    }

    @Test
    void testDataPreservationDuringUpgrade() {
        // Create a secondary database schema to test upgrade from a legacy version
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS legacy_test");

        Flyway legacyFlyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas("legacy_test")
                .target("031") // Version representing the canonical base
                .load();

        legacyFlyway.clean();
        legacyFlyway.migrate();

        // Seed some legacy data
        JdbcTemplate legacyJdbc = new JdbcTemplate(dataSource);
        legacyJdbc.execute("SET search_path TO legacy_test");

        UUID studentId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();

        // Seed users
        legacyJdbc.update("INSERT INTO app_users (id, email, password_hash, created_at) VALUES (?, 'test1@test.com', 'hash', now())", studentId);
        legacyJdbc.update("INSERT INTO app_users (id, email, password_hash, created_at) VALUES (?, 'test2@test.com', 'hash', now())", teacherId);

        // Seed legacy wallet entries if wallets table was used in V031. Wait, V031 already had wallets?
        // V031 added idempotency. Wallets existed.
        legacyJdbc.update("INSERT INTO wallets (id, owner_type, teacher_id, balance, frozen_balance, currency, created_at) VALUES (?, 'TEACHER', ?, 500, 0, 'VND', now())", UUID.randomUUID(), teacherId);

        // Now upgrade to latest
        Flyway latestFlyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas("legacy_test")
                .load();

        latestFlyway.migrate();

        // Verify data was preserved
        legacyJdbc.execute("SET search_path TO legacy_test");
        Integer walletCount = legacyJdbc.queryForObject("SELECT count(*) FROM wallets", Integer.class);
        assertThat(walletCount).isGreaterThanOrEqualTo(1);
    }

    private void verifyDatabaseConstraints() {
        Integer fkCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'", Integer.class);
        assertThat(fkCount).isGreaterThan(0);

        Integer uniqueCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'UNIQUE' AND table_schema = 'public'", Integer.class);
        assertThat(uniqueCount).isGreaterThan(0);
    }
}
