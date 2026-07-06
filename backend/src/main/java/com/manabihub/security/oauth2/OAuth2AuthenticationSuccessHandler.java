package com.manabihub.security.oauth2;

import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.repository.StudentProfileRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

        private final JwtEncoder jwtEncoder;
        private final StudentProfileRepository studentProfileRepository;

        @Value("${app.frontend.onboarding-url:http://localhost:5173/onboarding/student}")
        private String frontendOnboardingUrl;

        @Value("${app.frontend.success-url:http://localhost:5173/auth/callback}")
        private String frontendSuccessUrl;

        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                        Authentication authentication) throws IOException, ServletException {

                CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();
                AppUser appUser = oauth2User.getAppUser();

                // 1. Generate JWT
                String token = generateJwtToken(appUser);

                // 2. Check onboarding status based on StudentProfile existence
                boolean isOnboardingCompleted = studentProfileRepository.existsByUserId(appUser.getId());

                // 3. Redirect to appropriate URL
                String targetUrl = isOnboardingCompleted ? frontendSuccessUrl + "?token=" + token
                                : frontendOnboardingUrl + "?token=" + token;

                log.info("OAuth2 login successful for {}. Redirecting to {}", appUser.getEmail(), targetUrl);
                getRedirectStrategy().sendRedirect(request, response, targetUrl);
        }

        private String generateJwtToken(AppUser appUser) {
                Instant now = Instant.now();

                // Match the algorithm used in SecurityConfig (HS256)
                JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();

                String roles = appUser.getRoles().stream()
                                .map(role -> role.getCode().name())
                                .collect(Collectors.joining(" "));

                JwtClaimsSet claims = JwtClaimsSet.builder()
                                .issuer("self")
                                .issuedAt(now)
                                .expiresAt(now.plus(24, ChronoUnit.HOURS))
                                .subject(appUser.getId().toString())
                                .claim("email", appUser.getEmail())
                                .claim("role", roles)
                                .claim("type", "PUBLIC_USER")
                                .build();

                return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
        }
}
