package com.manabihub.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.security.config.TeacherEligibilityFilter;
import com.manabihub.security.config.InternalAdminRoleFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;

@TestConfiguration
public class DummyFilterConfig {

    /** Pass-through fixture for controller slices that are not testing eligibility. */
    @Bean
    @Primary
    public TeacherEligibilityFilter teacherEligibilityFilter() {
        return new TeacherEligibilityFilter(new JdbcTemplate(), new ObjectMapper()) {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                filterChain.doFilter(request, response);
            }
        };
    }

    /** Pass-through fixture for controller slices that are not testing live admin roles. */
    @Bean
    @Primary
    public InternalAdminRoleFilter internalAdminRoleFilter() {
        return new InternalAdminRoleFilter(new JdbcTemplate(), new ObjectMapper()) {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                filterChain.doFilter(request, response);
            }
        };
    }
}
