package com.manabihub.finance.service.impl;

import com.manabihub.finance.dto.response.RevenueDashboardResponse;
import com.manabihub.finance.enums.RevenueGranularity;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.service.CurrentUserService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Testcontainers(disabledWithoutDocker = true)
class FinanceRevenueServicePostgresTest {

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static NamedParameterJdbcTemplate jdbcTemplate;

    @BeforeAll
    static void createRevenueSchema() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(),
                POSTGRES.getPassword()
        );
        JdbcTemplate schema = new JdbcTemplate(dataSource);
        schema.execute("CREATE TABLE orders (id UUID PRIMARY KEY, order_type TEXT NOT NULL)");
        schema.execute("""
                CREATE TABLE payment_transactions (
                    order_id UUID NOT NULL,
                    status TEXT NOT NULL,
                    succeeded_at TIMESTAMPTZ
                )
                """);
        schema.execute("CREATE TABLE order_items (id UUID PRIMARY KEY, order_id UUID NOT NULL)");
        schema.execute("CREATE TABLE order_item_snapshots (order_item_id UUID NOT NULL, gross_amount NUMERIC NOT NULL)");
        schema.execute("""
                CREATE TABLE refund_requests (
                    id UUID PRIMARY KEY,
                    order_item_id UUID NOT NULL,
                    status TEXT NOT NULL,
                    settled_at TIMESTAMPTZ,
                    decided_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ NOT NULL
                )
                """);
        schema.execute("""
                CREATE TABLE platform_commission_ledgers (
                    event_type TEXT NOT NULL,
                    amount NUMERIC NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL
                )
                """);
        schema.execute("""
                CREATE TABLE system_expenses (
                    id UUID PRIMARY KEY,
                    status TEXT NOT NULL,
                    incurred_at DATE NOT NULL
                )
                """);
        schema.execute("""
                CREATE TABLE system_expense_lines (
                    expense_id UUID NOT NULL,
                    category_code TEXT NOT NULL,
                    amount_vnd NUMERIC NOT NULL
                )
                """);
        jdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
    }

    @Test
    void dashboardBindsInstantRangeAgainstPostgresWithoutTypeInferenceFailure() {
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        InternalAdminAccountRepository adminRepository = mock(InternalAdminAccountRepository.class);
        UUID adminId = UUID.randomUUID();
        when(currentUserService.getCurrentUserId()).thenReturn(adminId);
        when(adminRepository.hasPermission(adminId, "FINANCE_REVENUE_VIEW")).thenReturn(true);

        FinanceRevenueServiceImpl service = new FinanceRevenueServiceImpl(
                jdbcTemplate,
                currentUserService,
                adminRepository
        );

        RevenueDashboardResponse response = service.getDashboard(
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-02T00:00:00Z"),
                RevenueGranularity.DAY
        );

        assertEquals(2, response.points().size());
        assertEquals("0.00", response.summary().grossSales().toPlainString());
    }
}
