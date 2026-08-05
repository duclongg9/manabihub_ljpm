package com.manabihub.payout.repository;

import com.manabihub.common.mail.EmailService;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Finance payout queue filtering against a real PostgreSQL instance.
 *
 * <p>The H2-backed unit tests cannot cover this: H2 happily infers a type for an
 * unbound {@code null} parameter, whereas PostgreSQL rejects it with
 * {@code could not determine data type of parameter $N}. Every combination of
 * omitted filters therefore has to be exercised here.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class PayoutQueueFilterPostgresTest {

    private static final UUID TEACHER_WITHDRAWAL_JANUARY =
            UUID.fromString("aa000000-0000-0000-0000-000000000001");
    private static final UUID TEACHER_WITHDRAWAL_MARCH =
            UUID.fromString("aa000000-0000-0000-0000-000000000002");
    private static final UUID STUDENT_WITHDRAWAL_MAY =
            UUID.fromString("aa000000-0000-0000-0000-000000000003");

    private static final LocalDateTime JANUARY = LocalDateTime.of(2026, 1, 10, 9, 0);
    private static final LocalDateTime MARCH = LocalDateTime.of(2026, 3, 15, 9, 0);
    private static final LocalDateTime MAY = LocalDateTime.of(2026, 5, 20, 9, 0);

    private static PostgreSQLContainer<?> postgres;

    @DynamicPropertySource
    static void configurePostgres(DynamicPropertyRegistry registry) {
        postgres = new PostgreSQLContainer<>("postgres:17-alpine");
        postgres.start();
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.properties.hibernate.dialect",
                () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
    }

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private EmailService emailService;

    private final PageRequest firstPage =
            PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "requestedAt"));

    @BeforeEach
    void seedQueue() {
        jdbcTemplate.update("DELETE FROM payout_settlements");
        jdbcTemplate.update("DELETE FROM withdrawal_requests");

        UUID teacherId = insertTeacher("Nguyen Van A", "queue-teacher");
        UUID studentId = insertStudent("Tran Thi B", "queue-student");
        UUID teacherWalletId = insertWallet("TEACHER", null, teacherId);
        UUID studentWalletId = insertWallet("STUDENT", studentId, null);

        insertTeacherWithdrawal(
                TEACHER_WITHDRAWAL_JANUARY, teacherId, teacherWalletId,
                WithdrawalStatus.PENDING, JANUARY);
        insertTeacherWithdrawal(
                TEACHER_WITHDRAWAL_MARCH, teacherId, teacherWalletId,
                WithdrawalStatus.APPROVED, MARCH);
        insertStudentWithdrawal(
                STUDENT_WITHDRAWAL_MAY, studentId, studentWalletId,
                WithdrawalStatus.PENDING, MAY);

        insertSettlement(
                TEACHER_WITHDRAWAL_MARCH, teacherId, teacherWalletId,
                ReconciliationStatus.CRITICAL_MISMATCH);
    }

    @Test
    void returnsEveryRequestWhenNoFilterIsSupplied() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, null, null, null, null, firstPage);

        assertEquals(3, page.getTotalElements());
        assertEquals(
                Set.of(TEACHER_WITHDRAWAL_JANUARY, TEACHER_WITHDRAWAL_MARCH, STUDENT_WITHDRAWAL_MAY),
                idsOf(page));
    }

    @Test
    void filtersByStartDateOnly() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, null, null, LocalDateTime.of(2026, 3, 1, 0, 0), null, firstPage);

        assertEquals(Set.of(TEACHER_WITHDRAWAL_MARCH, STUDENT_WITHDRAWAL_MAY), idsOf(page));
        assertFalse(idsOf(page).contains(TEACHER_WITHDRAWAL_JANUARY));
    }

    @Test
    void filtersByEndDateOnly() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, null, null, null, LocalDateTime.of(2026, 3, 31, 23, 59, 59), firstPage);

        assertEquals(Set.of(TEACHER_WITHDRAWAL_JANUARY, TEACHER_WITHDRAWAL_MARCH), idsOf(page));
    }

    @Test
    void filtersByBothDates() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, null, null,
                LocalDateTime.of(2026, 3, 1, 0, 0),
                LocalDateTime.of(2026, 4, 1, 0, 0),
                firstPage);

        assertEquals(Set.of(TEACHER_WITHDRAWAL_MARCH), idsOf(page));
    }

    @Test
    void filtersByStatusWithoutDates() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                WithdrawalStatus.PENDING, null, null, null, null, firstPage);

        assertEquals(Set.of(TEACHER_WITHDRAWAL_JANUARY, STUDENT_WITHDRAWAL_MAY), idsOf(page));
    }

    @Test
    void filtersByReconciliationStatusWithoutDates() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, ReconciliationStatus.CRITICAL_MISMATCH, null, null, null, firstPage);

        assertEquals(Set.of(TEACHER_WITHDRAWAL_MARCH), idsOf(page));
    }

    @Test
    void combinesStatusReconciliationAndDateRange() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                WithdrawalStatus.APPROVED,
                ReconciliationStatus.CRITICAL_MISMATCH,
                null,
                LocalDateTime.of(2026, 1, 1, 0, 0),
                LocalDateTime.of(2026, 12, 31, 0, 0),
                firstPage);

        assertEquals(Set.of(TEACHER_WITHDRAWAL_MARCH), idsOf(page));
    }

    @Test
    void matchesTeacherAndStudentOwnersByKeyword() {
        Page<WithdrawalRequest> teacherMatches = withdrawalRequestRepository.findPayoutQueue(
                null, null, "%nguyen%", null, null, firstPage);
        assertEquals(
                Set.of(TEACHER_WITHDRAWAL_JANUARY, TEACHER_WITHDRAWAL_MARCH),
                idsOf(teacherMatches));

        Page<WithdrawalRequest> studentMatches = withdrawalRequestRepository.findPayoutQueue(
                null, null, "%queue-student%", null, null, firstPage);
        assertEquals(Set.of(STUDENT_WITHDRAWAL_MAY), idsOf(studentMatches));
    }

    @Test
    void appliesSortAndPaginationWithoutFilters() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, null, null, null, null,
                PageRequest.of(0, 2, Sort.by(Sort.Direction.DESC, "requestedAt")));

        assertEquals(3, page.getTotalElements());
        assertEquals(2, page.getTotalPages());
        List<UUID> ordered = page.getContent().stream().map(WithdrawalRequest::getId).toList();
        assertEquals(List.of(STUDENT_WITHDRAWAL_MAY, TEACHER_WITHDRAWAL_MARCH), ordered);
    }

    @Test
    void returnsEmptyPageWhenRangeExcludesEverything() {
        Page<WithdrawalRequest> page = withdrawalRequestRepository.findPayoutQueue(
                null, null, null,
                LocalDateTime.of(2027, 1, 1, 0, 0),
                LocalDateTime.of(2027, 12, 31, 0, 0),
                firstPage);

        assertEquals(0, page.getTotalElements());
        assertTrue(page.getContent().isEmpty());
    }

    private Set<UUID> idsOf(Page<WithdrawalRequest> page) {
        return page.getContent().stream()
                .map(WithdrawalRequest::getId)
                .collect(Collectors.toSet());
    }

    private UUID insertTeacher(String displayName, String emailPrefix) {
        UUID userId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO app_users (id, email, full_name, provider, user_status)
                VALUES (?, ?, ?, 'GOOGLE', 'ACTIVE')
                """, userId, emailPrefix + "+" + userId + "@test.local", displayName);
        jdbcTemplate.update("""
                INSERT INTO teacher_profiles (id, user_id, display_name)
                VALUES (?, ?, ?)
                """, teacherId, userId, displayName);
        return teacherId;
    }

    private UUID insertStudent(String displayName, String emailPrefix) {
        UUID userId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO app_users (id, email, full_name, provider, user_status)
                VALUES (?, ?, ?, 'GOOGLE', 'ACTIVE')
                """, userId, emailPrefix + "+" + userId + "@test.local", displayName);
        jdbcTemplate.update("""
                INSERT INTO student_profiles (id, user_id, display_name)
                VALUES (?, ?, ?)
                """, studentId, userId, displayName);
        return studentId;
    }

    private UUID insertWallet(String ownerType, UUID studentId, UUID teacherId) {
        UUID walletId = UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO wallets (
                    id, owner_type, student_id, teacher_id, balance, frozen_balance, currency
                )
                VALUES (?, ?, ?, ?, 0, 0, 'VND')
                """, walletId, ownerType, studentId, teacherId);
        return walletId;
    }

    private void insertTeacherWithdrawal(
            UUID id,
            UUID teacherId,
            UUID walletId,
            WithdrawalStatus status,
            LocalDateTime requestedAt
    ) {
        jdbcTemplate.update("""
                INSERT INTO withdrawal_requests (
                    id, owner_type, teacher_id, student_id, wallet_id,
                    amount, status, requested_at, created_at
                )
                VALUES (?, 'TEACHER', ?, NULL, ?, ?, ?, ?, ?)
                """,
                id, teacherId, walletId, new BigDecimal("500000.00"),
                status.name(), requestedAt, requestedAt);
    }

    private void insertStudentWithdrawal(
            UUID id,
            UUID studentId,
            UUID walletId,
            WithdrawalStatus status,
            LocalDateTime requestedAt
    ) {
        jdbcTemplate.update("""
                INSERT INTO withdrawal_requests (
                    id, owner_type, teacher_id, student_id, wallet_id,
                    amount, status, requested_at, created_at
                )
                VALUES (?, 'STUDENT', NULL, ?, ?, ?, ?, ?, ?)
                """,
                id, studentId, walletId, new BigDecimal("300000.00"),
                status.name(), requestedAt, requestedAt);
    }

    private void insertSettlement(
            UUID withdrawalRequestId,
            UUID teacherId,
            UUID walletId,
            ReconciliationStatus reconciliationStatus
    ) {
        jdbcTemplate.update("""
                INSERT INTO payout_settlements (
                    id, withdrawal_request_id, owner_type, teacher_id, student_id,
                    wallet_id, amount, status, reconciliation_status, idempotency_key
                )
                VALUES (?, ?, 'TEACHER', ?, NULL, ?, ?, 'SUCCEEDED', ?, ?)
                """,
                UUID.randomUUID(), withdrawalRequestId, teacherId, walletId,
                new BigDecimal("500000.00"), reconciliationStatus.name(),
                "queue-test-" + withdrawalRequestId);
    }
}
