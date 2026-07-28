package com.manabihub.payment.service.impl;

import com.manabihub.notification.service.NotificationService;
import com.manabihub.payment.dto.IpnAckResponse;
import com.manabihub.payment.gateway.PaymentCallbackResult;
import com.manabihub.payment.gateway.PaymentGateway;
import com.manabihub.payment.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class PaymentFinancialIntegrityConcurrencyPostgresTest {

    private static final UUID STUDENT_ID =
            UUID.fromString("e0000000-0000-0000-0000-000000000001");
    private static final UUID TEACHER_ID =
            UUID.fromString("e0000000-0000-0000-0000-000000000002");
    private static final UUID COURSE_ID =
            UUID.fromString("f0000000-0000-0000-0000-000000000001");
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
    private PaymentService paymentService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private PaymentGateway paymentGateway;

    @MockBean
    private NotificationService notificationService;

    @Test
    void concurrentSuccessfulCallbacksCreateOneImmutableAllocationSet() throws Exception {
        UUID orderId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();
        String orderCode = "MHB74-" + orderId;
        BigDecimal gross = new BigDecimal("100000.00");
        BigDecimal balanceBefore = teacherBalance();
        BigDecimal frozenBefore = teacherFrozenBalance();
        BigDecimal availableBefore = balanceBefore.subtract(frozenBefore);

        jdbcTemplate.update("""
                INSERT INTO orders (
                    id, student_id, order_code, total_amount, currency, order_status
                )
                VALUES (?, ?, ?, ?, 'VND', 'PENDING')
                """, orderId, STUDENT_ID, orderCode, gross);
        jdbcTemplate.update("""
                INSERT INTO order_items (id, order_id, course_id, price)
                VALUES (?, ?, ?, ?)
                """, orderItemId, orderId, COURSE_ID, gross);

        when(paymentGateway.getProvider()).thenReturn("TEST");
        when(paymentGateway.parseCallback(anyMap())).thenReturn(new PaymentCallbackResult(
                true,
                orderCode,
                "TX-" + orderId,
                10_000_000L,
                "00",
                "00",
                true));

        int workers = 8;
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<IpnAckResponse>> futures = new ArrayList<>();

        try {
            for (int index = 0; index < workers; index++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    return paymentService.handleIpn(Map.of("vnp_TxnRef", orderCode));
                }));
            }

            assertTrue(ready.await(10, TimeUnit.SECONDS), "Workers did not become ready");
            start.countDown();

            int confirmed = 0;
            int duplicate = 0;
            List<Throwable> errors = new ArrayList<>();
            for (Future<IpnAckResponse> future : futures) {
                try {
                    String code = future.get(30, TimeUnit.SECONDS).rspCode();
                    if ("00".equals(code)) {
                        confirmed++;
                    } else if ("02".equals(code)) {
                        duplicate++;
                    }
                } catch (Exception exception) {
                    errors.add(exception.getCause() == null ? exception : exception.getCause());
                }
            }

            assertEquals(List.of(), errors, "Concurrent callbacks must not fail");
            assertEquals(1, confirmed, "Exactly one callback must confirm payment");
            assertEquals(workers - 1, duplicate, "All other callbacks must be idempotent");
        } finally {
            start.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(30, TimeUnit.SECONDS), "Executor must terminate");
        }

        assertEquals("PAID", jdbcTemplate.queryForObject(
                "SELECT order_status FROM orders WHERE id = ?",
                String.class,
                orderId));
        assertEquals(1, count("SELECT COUNT(*) FROM order_item_snapshots WHERE order_item_id = ?", orderItemId));
        assertEquals(1, count("SELECT COUNT(*) FROM escrow_ledger WHERE order_item_id = ?", orderItemId));
        assertEquals(1, count("""
                SELECT COUNT(*)
                FROM platform_commission_ledgers
                WHERE order_item_id = ?
                  AND event_type = 'COMMISSION_HELD'
                  AND amount = 20000.00
                """, orderItemId));
        assertEquals(1, count("""
                SELECT COUNT(*)
                FROM wallet_transactions wallet_tx
                JOIN escrow_ledger escrow ON escrow.id = wallet_tx.reference_id
                WHERE escrow.order_item_id = ?
                  AND wallet_tx.reference_type = 'ESCROW'
                  AND wallet_tx.transaction_type = 'ESCROW_HOLD'
                  AND wallet_tx.amount = 80000.00
                """, orderItemId));
        assertEquals(0, frozenBefore.add(new BigDecimal("80000.00"))
                .compareTo(teacherFrozenBalance()));
        assertEquals(0, balanceBefore.add(new BigDecimal("80000.00"))
                .compareTo(teacherBalance()));
        assertEquals(0, availableBefore.compareTo(
                teacherBalance().subtract(teacherFrozenBalance())));

        assertThrows(DataAccessException.class, () -> jdbcTemplate.update("""
                UPDATE order_item_snapshots
                SET commission_rate = 0.50
                WHERE order_item_id = ?
                """, orderItemId));
        assertThrows(DataAccessException.class, () -> jdbcTemplate.update("""
                UPDATE platform_commission_ledgers
                SET amount = 1
                WHERE order_item_id = ?
                """, orderItemId));
    }

    private int count(String sql, UUID id) {
        return jdbcTemplate.queryForObject(sql, Integer.class, id);
    }

    private BigDecimal teacherFrozenBalance() {
        return jdbcTemplate.queryForObject("""
                SELECT COALESCE(
                    (
                        SELECT frozen_balance
                        FROM wallets
                        WHERE teacher_id = ?
                    ),
                    0
                )
                """, BigDecimal.class, TEACHER_ID);
    }

    private BigDecimal teacherBalance() {
        return jdbcTemplate.queryForObject("""
                SELECT COALESCE(
                    (
                        SELECT balance
                        FROM wallets
                        WHERE teacher_id = ?
                    ),
                    0
                )
                """, BigDecimal.class, TEACHER_ID);
    }
}
