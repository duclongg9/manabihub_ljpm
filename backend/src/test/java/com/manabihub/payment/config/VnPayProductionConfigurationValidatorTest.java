package com.manabihub.payment.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class VnPayProductionConfigurationValidatorTest {

    private static final String FRONTEND_URL = "https://develop.example.amplifyapp.com";

    @Test
    void validate_AcceptsExactHttpsReturnRouteOnFrontendOrigin() {
        assertDoesNotThrow(() -> VnPayProductionConfigurationValidator.validate(
                FRONTEND_URL + "/checkout/return",
                FRONTEND_URL
        ));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "http://develop.example.amplifyapp.com/checkout/return",
            "https://localhost:5173/checkout/return",
            "https://localhost./checkout/return",
            "https://127.0.0.1/checkout/return",
            "https://other.example.com/checkout/return",
            "https://develop.example.amplifyapp.com/checkout/callback",
            "https://develop.example.amplifyapp.com/checkout/return?next=/courses",
            "https://develop.example.amplifyapp.com/checkout/return#result"
    })
    void validate_RejectsUnsafeOrUnroutableProductionReturnUrl(String returnUrl) {
        assertThrows(
                IllegalStateException.class,
                () -> VnPayProductionConfigurationValidator.validate(returnUrl, FRONTEND_URL)
        );
    }

    @Test
    void validate_RejectsNonHttpsFrontendOrigin() {
        assertThrows(
                IllegalStateException.class,
                () -> VnPayProductionConfigurationValidator.validate(
                        FRONTEND_URL + "/checkout/return",
                        "http://develop.example.amplifyapp.com"
                )
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://10.0.0.1",
            "https://169.254.1.1",
            "https://224.0.0.1",
            "https://[::1]",
            "https://[0:0:0:0:0:0:0:1]",
            "https://[::ffff:127.0.0.1]",
            "https://[fc00::1]",
            "https://[fe80::1]",
            "https://[ff02::1]"
    })
    void validate_RejectsLocalOrPrivateIpEvenWhenFrontendUsesSameOrigin(String origin) {
        assertThrows(
                IllegalStateException.class,
                () -> VnPayProductionConfigurationValidator.validate(
                        origin + "/checkout/return",
                        origin
                )
        );
    }
}
