package com.manabihub.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api/v1/demo/**",  // TODO: Remove before production release
                                "/api/v1/mock/**",  // TODO: Remove before production release
                                "/api/v1/teacher/kyc/**"  // TODO: Protect with authenticated TEACHER role when JWT is implemented
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    // TODO: [UC-21 Tech Debt] This mock decoder accepts any UUID as a valid JWT.
    // It is gated by @ConditionalOnProperty so it ONLY activates when
    // manabihub.security.mock-jwt=true (set in application-local.yml).
    // Replace with real JWT validation (e.g., Keycloak, Spring Auth Server) before production.
    @Bean
    @ConditionalOnProperty(name = "manabihub.security.mock-jwt", havingValue = "true")
    public JwtDecoder mockJwtDecoder() {
        return token -> {
            // MOCK JWT DECODER FOR DEVELOPMENT/TESTING
            // Allows the frontend to send a UUID as a Bearer token
            try {
                java.util.UUID.fromString(token);
                return org.springframework.security.oauth2.jwt.Jwt.withTokenValue(token)
                        .header("alg", "none")
                        .claim("sub", token)
                        .build();
            } catch (Exception e) {
                throw new JwtException("Invalid mock token: " + token);
            }
        };
    }

    @Bean
    @ConditionalOnMissingBean(JwtDecoder.class)
    public JwtDecoder defaultJwtDecoder() {
        return token -> {
            throw new JwtException("JWT validation is not implemented yet or mock-jwt is disabled. JWT Token: " + token);
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
