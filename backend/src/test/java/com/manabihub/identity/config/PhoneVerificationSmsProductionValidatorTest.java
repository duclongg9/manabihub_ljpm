package com.manabihub.identity.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PhoneVerificationSmsProductionValidatorTest {

    @Test
    void validate_AcceptsCompleteEsmsConfiguration() {
        PhoneVerificationSmsProperties properties = esmsProperties();

        assertDoesNotThrow(() -> PhoneVerificationSmsProductionValidator.validate(properties));
    }

    @Test
    void validate_RejectsMissingEsmsSecret() {
        PhoneVerificationSmsProperties properties = esmsProperties();
        properties.getEsms().setSecretKey(" ");

        assertThrows(
                IllegalStateException.class,
                () -> PhoneVerificationSmsProductionValidator.validate(properties)
        );
    }

    @Test
    void validate_RejectsDisabledProductionMode() {
        PhoneVerificationSmsProperties properties = esmsProperties();
        properties.setSmsMode("disabled");

        assertThrows(
                IllegalStateException.class,
                () -> PhoneVerificationSmsProductionValidator.validate(properties)
        );
    }

    @Test
    void validate_RejectsInsecureWebhookUrl() {
        PhoneVerificationSmsProperties properties = new PhoneVerificationSmsProperties();
        properties.setSmsMode("webhook");
        properties.setSmsWebhookUrl("http://provider.example/messages");
        properties.setSmsApiKey("secret");

        assertThrows(
                IllegalStateException.class,
                () -> PhoneVerificationSmsProductionValidator.validate(properties)
        );
    }

    private PhoneVerificationSmsProperties esmsProperties() {
        PhoneVerificationSmsProperties properties = new PhoneVerificationSmsProperties();
        properties.setSmsMode("esms");
        properties.setSmsTimeoutSeconds(5);
        properties.getEsms().setApiKey("api-key");
        properties.getEsms().setSecretKey("secret-key");
        properties.getEsms().setBrandname("ManabiHub");
        return properties;
    }
}
