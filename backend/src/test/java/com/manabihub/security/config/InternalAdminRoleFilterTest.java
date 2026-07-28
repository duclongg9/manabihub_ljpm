package com.manabihub.security.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class InternalAdminRoleFilterTest {

    private JdbcTemplate jdbcTemplate;
    private InternalAdminRoleFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        filter = new InternalAdminRoleFilter(
                jdbcTemplate,
                new ObjectMapper().findAndRegisterModules()
        );
        filterChain = mock(FilterChain.class);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void matchingLiveRoleAllowsAdminRequest() throws Exception {
        UUID adminId = authenticate("SYSTEM_ADMIN");
        when(jdbcTemplate.queryForList(anyString(), eq(String.class), eq(adminId)))
                .thenReturn(List.of("SYSTEM_ADMIN"));
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/admin/system-settings"
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void staleRoleReturns401SoFrontendClearsAdminSession() throws Exception {
        UUID adminId = authenticate("SYSTEM_ADMIN");
        when(jdbcTemplate.queryForList(anyString(), eq(String.class), eq(adminId)))
                .thenReturn(List.of("COURSE_MANAGER"));
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/admin/system-settings"
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertEquals(
                MessageCodes.ADMIN_SESSION_STALE,
                new ObjectMapper().readTree(response.getContentAsByteArray())
                        .get("messageCode")
                        .asText()
        );
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void publicAdminLoginDoesNotReadLiveRole() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "POST",
                "/api/admin/auth/login"
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jdbcTemplate);
    }

    private UUID authenticate(String role) {
        UUID adminId = UUID.randomUUID();
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(adminId.toString())
                .claim("role", role)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new JwtAuthenticationToken(
                        jwt,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                )
        );
        return adminId;
    }
}
